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

const TEST_EMAILS = [
  "test412e@gmail.com",
  "testejv@gmail.com",
  "jvtestes@gmail.com",
  "testenn@gmail.com",
];
const PERSONAL_EMAILS = [
  "lopesconexoes@gmail.com",
  "andreylopes.ia@gmail.com",
  "jv241004@gmail.com",
];

const ALL_ORPHAN_EMAILS = [...TEST_EMAILS, ...PERSONAL_EMAILS];

const { data: orphans } = await supa
  .from("users")
  .select("id, email")
  .in("email", ALL_ORPHAN_EMAILS);

const orphanIds = orphans.map((u) => u.id);
const idToEmail = Object.fromEntries(orphans.map((u) => [u.id, u.email]));

console.log(`Órfãos encontrados: ${orphans.length}`);
for (const u of orphans) console.log(`  ${u.email} → ${u.id}`);

// Tables that reference users (sample of FKs)
const REF_TABLES = [
  { table: "objectives", cols: ["owner_id", "assignee_id", "created_by"] },
  { table: "key_results", cols: ["owner_user_id"] },
  { table: "okr_check_ins", cols: ["user_id"] },
  { table: "objective_collaborators", cols: ["user_id"] },
  { table: "posts", cols: ["author_id"] },
  { table: "post_comments", cols: ["author_id"] },
  { table: "post_reactions", cols: ["user_id"] },
  { table: "recognitions", cols: ["from_user_id", "to_user_id"] },
  { table: "feedback_requests", cols: ["requester_id", "subject_user_id", "respondent_id"] },
  { table: "feedback_responses", cols: ["respondent_id"] },
  { table: "performance_evaluations", cols: ["evaluator_id", "evaluated_id"] },
  { table: "pulse_responses", cols: ["user_id"] },
  { table: "notifications", cols: ["user_id", "actor_id"] },
  { table: "company_memberships", cols: ["user_id"] },
  { table: "team_members", cols: ["user_id"] },
  { table: "user_roles", cols: ["user_id"] },
  { table: "gamification_points", cols: ["user_id"] },
  { table: "gamification_history", cols: ["user_id"] },
  { table: "user_streaks", cols: ["user_id"] },
];

console.log("\n=== Refs por user e tabela ===");
const refsByUser = Object.fromEntries(orphanIds.map((id) => [id, {}]));

for (const { table, cols } of REF_TABLES) {
  for (const col of cols) {
    const { data, error } = await supa
      .from(table)
      .select(`id, ${col}`)
      .in(col, orphanIds);
    if (error) {
      // table or col doesn't exist; skip
      continue;
    }
    for (const row of data ?? []) {
      const uid = row[col];
      if (!refsByUser[uid][table]) refsByUser[uid][table] = {};
      refsByUser[uid][table][col] = (refsByUser[uid][table][col] || 0) + 1;
    }
  }
}

for (const u of orphans) {
  const refs = refsByUser[u.id];
  const total = Object.values(refs).reduce(
    (sum, cols) => sum + Object.values(cols).reduce((s, n) => s + n, 0),
    0
  );
  console.log(`\n${u.email} → ${total} ref(s)`);
  for (const [table, cols] of Object.entries(refs)) {
    for (const [col, count] of Object.entries(cols)) {
      console.log(`  ${table}.${col}: ${count}`);
    }
  }
}

// Save for next step
const safeToDelete = [];
const needsMigration = [];
for (const u of orphans) {
  const refs = refsByUser[u.id];
  const total = Object.values(refs).reduce(
    (sum, cols) => sum + Object.values(cols).reduce((s, n) => s + n, 0),
    0
  );
  if (total === 0) safeToDelete.push(u);
  else needsMigration.push({ user: u, refs });
}

console.log("\n=== RESUMO ===");
console.log(`Sem refs (safe to delete): ${safeToDelete.length}`);
for (const u of safeToDelete) console.log(`  ${u.email}`);
console.log(`Com refs (precisa migrar): ${needsMigration.length}`);
for (const { user, refs } of needsMigration) {
  console.log(`  ${user.email}:`);
  for (const [t, cols] of Object.entries(refs)) {
    console.log(`    ${t}: ${JSON.stringify(cols)}`);
  }
}
