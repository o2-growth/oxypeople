#!/usr/bin/env node
/**
 * Backfill `company_memberships.okr_access_level` from current `position`.
 *
 * Heuristic:
 *   manager     → CEO, COO, CTO, CMO, CFO, VP, Head, Diretor, C-Level
 *   restricted  → Estagiário, Júnior / Jr, Trainee
 *   contributor → everything else (default)
 *
 * Usage:
 *   node scripts/backfill-okr-access.mjs            # dry-run, prints proposed mapping
 *   node scripts/backfill-okr-access.mjs --apply    # writes
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

const apply = process.argv.includes("--apply");

// CaaS = "CFO as a Service" — terceirizados, não criam OKR da o2-growth.
const CAAS_RX = /\bCFO\s+as\s+a\s+Service\b/i;
const MANAGER_RX = /\b(CEO|COO|CTO|CMO|CFO|CHRO|CRO|VP|Head|Diretor[ae]?|C\-Level|Chief)\b/i;
// Plural-tolerant: "Estagiária", "Estagiárias", "Júnior", "Jr", "Jr.", "Trainee", "Aprendiz".
const RESTRICTED_RX = /(Estagi[áa]ri[oa]s?|J[úu]nior|\bJr\.?\b|Trainee|Aprendiz)/i;

function classify(position) {
  if (!position) return "contributor";
  if (CAAS_RX.test(position)) return "contributor";
  if (RESTRICTED_RX.test(position)) return "restricted";
  if (MANAGER_RX.test(position)) return "manager";
  return "contributor";
}

const { data: company } = await supa
  .from("companies")
  .select("id, name")
  .eq("name", "o2-growth")
  .single();
console.log(`company: ${company.name} (${company.id})`);

const { data: members } = await supa
  .from("company_memberships")
  .select("id, user_id, position, okr_access_level, users:user_id (full_name, email)")
  .eq("company_id", company.id);

const groups = { manager: [], contributor: [], restricted: [] };
const updates = [];
for (const m of members) {
  const target = classify(m.position);
  groups[target].push({
    name: m.users?.full_name ?? m.users?.email ?? "?",
    position: m.position ?? "(sem cargo)",
  });
  if (m.okr_access_level !== target) {
    updates.push({ id: m.id, target, prev: m.okr_access_level });
  }
}

for (const [tier, rows] of Object.entries(groups)) {
  console.log(`\n=== ${tier.toUpperCase()} (${rows.length}) ===`);
  for (const r of rows.sort((a, b) => a.position.localeCompare(b.position))) {
    console.log(`  ${r.position.padEnd(45)} ${r.name}`);
  }
}

console.log(`\nProposed updates: ${updates.length}/${members.length}`);

if (!apply) {
  console.log("\nDRY RUN — pass --apply to write.");
  process.exit(0);
}

let ok = 0;
for (const u of updates) {
  const { error } = await supa
    .from("company_memberships")
    .update({ okr_access_level: u.target })
    .eq("id", u.id);
  if (error) console.error("update error:", error.message);
  else ok++;
}
console.log(`\nDONE. updated=${ok}/${updates.length}`);
