#!/usr/bin/env node
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

console.log("=== 1. Company info ===");
const { data: company } = await supa
  .from("companies")
  .select("id, name, owner_id")
  .eq("id", COMPANY_ID)
  .single();
console.log(company);

if (company?.owner_id) {
  const { data: owner } = await supa
    .from("users")
    .select("email, full_name")
    .eq("id", company.owner_id)
    .single();
  console.log(`Owner: ${owner?.full_name} <${owner?.email}>`);
} else {
  console.log("Company SEM owner_id setado!");
}

console.log("\n=== 2. Positions dos members ===");
const { data: memberships, error: mErr } = await supa
  .from("company_memberships")
  .select("*")
  .eq("company_id", COMPANY_ID);
if (mErr) {
  console.log("memberships error:", mErr);
  process.exit(1);
}
console.log(`Schema sample:`, Object.keys(memberships[0] ?? {}));

const userIds = memberships.map((m) => m.user_id);
const { data: users } = await supa
  .from("users")
  .select("id, email, full_name")
  .in("id", userIds);
const byId = Object.fromEntries(users.map((u) => [u.id, u]));

console.log(`Total memberships: ${memberships.length}`);
const withManager = memberships.filter((m) => m.manager_id).length;
const withPosition = memberships.filter((m) => m.position).length;
console.log(`  Com manager_id: ${withManager}`);
console.log(`  Com position: ${withPosition}`);

// Group by position keyword
const positionGroups = {};
for (const m of memberships) {
  const pos = m.position || "(sem cargo)";
  (positionGroups[pos] ||= []).push(byId[m.user_id]?.full_name || byId[m.user_id]?.email);
}

console.log("\nDistribuição por position:");
const sorted = Object.entries(positionGroups).sort((a, b) => b[1].length - a[1].length);
for (const [pos, people] of sorted.slice(0, 25)) {
  console.log(`  ${pos.padEnd(40)} ${people.length} pessoa(s)`);
  if (people.length <= 3) {
    for (const p of people) console.log(`     - ${p}`);
  }
}

console.log("\n=== 3. Procurando C-Level / Diretoria ===");
const cLevelPatterns = [
  /^CEO$/i, /^COO$/i, /^CTO$/i, /^CFO$/i, /^CMO$/i, /^CPO$/i, /^CRO$/i, /^CSO$/i, /^CHRO$/i,
  /Sócio/i, /Diretor/i, /Director/i, /VP /i, /Vice/i, /Head of/i, /Founder/i,
];

const cLevel = [];
for (const m of memberships) {
  const pos = m.position || "";
  if (cLevelPatterns.some((p) => p.test(pos))) {
    cLevel.push({
      user: byId[m.user_id],
      position: pos,
      manager_id: m.manager_id,
    });
  }
}
console.log(`C-Level/Diretoria encontrados: ${cLevel.length}`);
for (const c of cLevel) {
  const mgr = c.manager_id ? byId[c.manager_id]?.full_name : "(sem gestor)";
  console.log(`  ${c.user?.full_name?.padEnd(40) ?? "?"} ${c.position.padEnd(30)} → ${mgr}`);
}

console.log("\n=== 4. Teams + leaders ===");
const { data: teams } = await supa
  .from("teams")
  .select("id, name, members:team_members(user_id, role)")
  .eq("company_id", COMPANY_ID);

for (const t of teams ?? []) {
  const leader = t.members?.find((m) => m.role === "leader" || m.role === "owner");
  const leaderUser = leader ? byId[leader.user_id] : null;
  console.log(`  ${t.name.padEnd(30)} líder=${leaderUser?.full_name ?? "(nenhum)"} membros=${t.members?.length ?? 0}`);
}

console.log("\n=== 5. Sample memberships com position ===");
for (const m of memberships.slice(0, 15)) {
  const u = byId[m.user_id];
  console.log(`  ${(u?.full_name ?? u?.email)?.padEnd(40)} ${(m.position ?? "-").padEnd(30)} mgr=${m.manager_id ? byId[m.manager_id]?.full_name : "-"}`);
}
