#!/usr/bin/env node
/**
 * Popula hierarquia organizacional baseada em positions reais.
 *
 * Regras:
 *  - CEO = topo (sem gestor)
 *  - COO/CTO/CMO/CFO → reportam ao CEO
 *  - Heads de área → reportam ao C-Level relevante
 *  - Squad leaders → reportam ao COO
 *  - Membros de squad → reportam ao líder do squad
 *  - Membros sem squad → reportam ao COO
 *
 * Operação: UPDATE manager_id em company_memberships (aditivo, sem DELETE).
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.local", ".env"]) {
  try {
    const env = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] ||= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const COMPANY_ID = "4a6cdaea-daef-47d2-897f-54d5ae999638";

// Fetch everything we need
const { data: memberships } = await supa
  .from("company_memberships")
  .select("user_id, position, manager_id")
  .eq("company_id", COMPANY_ID);

const { data: users } = await supa
  .from("users")
  .select("id, email, full_name");

const { data: teams } = await supa
  .from("teams")
  .select("id, name, members:team_members(user_id, role)")
  .eq("company_id", COMPANY_ID);

const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));
const userById = Object.fromEntries(users.map((u) => [u.id, u]));
const membershipByUserId = Object.fromEntries(
  memberships.map((m) => [m.user_id, m]),
);

function id(email) {
  return userByEmail[email]?.id;
}

// === STEP 0: setar company.owner_id = CEO ===
const ceoId = id("pedro.albite@o2inc.com.br");
console.log(`CEO: Pedro Albite → ${ceoId}`);

const { error: ownerErr } = await supa
  .from("companies")
  .update({ owner_id: ceoId })
  .eq("id", COMPANY_ID);
if (ownerErr) console.log("owner_id update error:", ownerErr.message);
else console.log("✓ company.owner_id setado");

// === STEP 1: mapear manager por user_id ===
const managerMap = new Map();

// CEO → null
managerMap.set(ceoId, null);

// C-Level reporta ao CEO
const cooId = id("tiago.pisoni@o2inc.com.br");
const ctoId = id("joao.freitas@o2inc.com.br");
const cmoId = id("rafael.fleck@o2inc.com.br");
managerMap.set(cooId, ceoId);
managerMap.set(ctoId, ceoId);
managerMap.set(cmoId, ceoId);

console.log(`\nC-Level mapeado:`);
console.log(`  COO Tiago Pisoni → CEO`);
console.log(`  CTO João Freitas → CEO`);
console.log(`  CMO Rafael Fleck → CEO`);

// === STEP 2: Heads reportam ao C-Level relevante ===
const headMappings = [
  { email: "andrey.lopes@o2inc.com.br", manager: ctoId, label: "Head de IA → CTO" },
  { email: "eduarda.rovani@o2inc.com.br", manager: cmoId, label: "Head de Marketing → CMO" },
  { email: "daniel.fernandes@o2inc.com.br", manager: cmoId, label: "Designer → CMO" },
  { email: "eduardo.pedrolo@o2inc.com.br", manager: cooId, label: "Head de Projetos → COO" },
  { email: "andrea.franzen@o2inc.com.br", manager: cooId, label: "Head CS → COO" },
  { email: "lucas.ilha@o2inc.com.br", manager: cooId, label: "Head O2 TAX → COO" },
  { email: "joseane.sartori@o2inc.com.br", manager: cooId, label: "Joseane CFO as a Service → COO" },
  { email: "enrico.orlando@o2inc.com.br", manager: ctoId, label: "Dev Sr Enrico → CTO" },
  { email: "pedro.santiago@o2inc.com.br", manager: ctoId, label: "Dev Sr Pedro → CTO" },
  { email: "felipe.bisotto@o2inc.com.br", manager: ctoId, label: "Dev Jr Felipe → CTO" },
  { email: "leonardo.rezende@o2inc.com.br", manager: ctoId, label: "Dev Pleno Leo → CTO" },
];
console.log(`\nHeads e times técnicos mapeados:`);
for (const h of headMappings) {
  const userId = id(h.email);
  if (userId) {
    managerMap.set(userId, h.manager);
    console.log(`  ${h.label}`);
  }
}

// === STEP 3: Squad leaders + members ===
console.log(`\nSquads → líderes reportam ao COO; membros reportam ao líder:`);
const squadLeaderEmails = new Set();
for (const team of teams ?? []) {
  // Find leader by checking members positions or first member
  const leaderRow = team.members?.find((m) => m.role === "leader" || m.role === "owner");
  const leaderId = leaderRow?.user_id;

  if (leaderId) {
    const leaderUser = userById[leaderId];
    squadLeaderEmails.add(leaderUser?.email);
    if (!managerMap.has(leaderId)) {
      managerMap.set(leaderId, cooId);
    }
    console.log(`  ${team.name}: líder ${leaderUser?.full_name} → COO`);

    // All other members report to leader
    for (const m of team.members ?? []) {
      if (m.user_id !== leaderId) {
        managerMap.set(m.user_id, leaderId);
      }
    }
  } else {
    console.log(`  ${team.name}: SEM líder (skipping)`);
  }
}

// === STEP 4: Default — quem ainda não tem manager → COO ===
console.log(`\nFallback: demais membros sem manager → COO`);
let fallbackCount = 0;
for (const m of memberships) {
  if (!managerMap.has(m.user_id) && m.user_id !== ceoId) {
    managerMap.set(m.user_id, cooId);
    fallbackCount++;
  }
}
console.log(`  ${fallbackCount} pessoas → COO`);

// === STEP 5: aplicar updates ===
console.log(`\n=== Aplicando ${managerMap.size} updates de manager_id ===`);
let updated = 0;
let skipped = 0;
const errors = [];

for (const [userId, managerId] of managerMap.entries()) {
  // Don't self-manage
  if (userId === managerId) {
    skipped++;
    continue;
  }
  const { error } = await supa
    .from("company_memberships")
    .update({ manager_id: managerId })
    .eq("company_id", COMPANY_ID)
    .eq("user_id", userId);
  if (error) {
    errors.push({ userId, error: error.message });
  } else {
    updated++;
  }
}

console.log(`\n✓ Atualizados: ${updated}`);
if (skipped) console.log(`Skipped (self-manage): ${skipped}`);
if (errors.length) {
  console.log(`Erros: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log(`  ${e.userId}: ${e.error}`);
}

// === STEP 6: verificar resultado ===
console.log(`\n=== Verificação ===`);
const { data: final } = await supa
  .from("company_memberships")
  .select("user_id, manager_id")
  .eq("company_id", COMPANY_ID);

const withMgr = final.filter((m) => m.manager_id).length;
const noMgr = final.filter((m) => !m.manager_id).length;
console.log(`Com manager_id: ${withMgr}`);
console.log(`Sem manager_id (devem ser CEOs/raízes): ${noMgr}`);

console.log(`\nRoots (sem manager):`);
for (const m of final.filter((m) => !m.manager_id)) {
  console.log(`  ${userById[m.user_id]?.full_name ?? userById[m.user_id]?.email}`);
}
