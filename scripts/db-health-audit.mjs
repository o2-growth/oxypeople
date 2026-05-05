#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dep)
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] ||= m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] ||= m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const TABLES = [
  "users", "companies", "company_memberships", "teams", "team_members",
  "departments", "user_roles",
  "objectives", "key_results", "okr_check_ins",
  "posts", "post_reactions", "post_comments",
  "recognitions", "badges",
  "feedback_requests", "feedback_responses",
  "performance_cycles", "performance_evaluations",
  "pulse_surveys", "pulse_responses",
  "notifications", "announcements",
  "gamification_points", "gamification_history",
  "user_streaks", "events", "calendar_events",
];

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return { table, count: count ?? null, error: error?.message ?? null };
}

console.log("=== DB Health Audit ===");
console.log("URL:", url);
console.log("");

const results = await Promise.all(TABLES.map(countTable));
const ok = [], missing = [], errors = [];
for (const r of results) {
  if (r.error?.includes("relation") || r.error?.includes("does not exist") || r.error?.includes("Not Found") || r.error?.includes("schema")) {
    missing.push(r);
  } else if (r.error) {
    errors.push(r);
  } else {
    ok.push(r);
  }
}

console.log(`Tabelas existentes (${ok.length}):`);
for (const r of ok.sort((a, b) => a.table.localeCompare(b.table))) {
  const flag = r.count === 0 ? " [VAZIA]" : "";
  console.log(`  ${r.table.padEnd(30)} ${String(r.count ?? "?").padStart(8)}${flag}`);
}

if (missing.length) {
  console.log(`\nTabelas ausentes (${missing.length}):`);
  for (const r of missing) console.log(`  ${r.table} - ${r.error}`);
}

if (errors.length) {
  console.log(`\nErros RLS/Permissão (${errors.length}):`);
  for (const r of errors) console.log(`  ${r.table} - ${r.error}`);
}

// Probe specific data quality
console.log("\n=== Data Quality Probes ===");

// 1. Users without primary_company_id
const { count: orphanUsers } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .is("primary_company_id", null);
console.log(`Users sem primary_company_id: ${orphanUsers ?? "?"}`);

// 2. Memberships
const { count: memberships } = await supabase
  .from("company_memberships")
  .select("*", { count: "exact", head: true });
console.log(`Total company_memberships: ${memberships ?? "?"}`);

// 3. Admins
const { data: admins } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "admin");
console.log(`Admins (user_roles): ${admins?.length ?? "?"}`);

// 4. Teams + members
const { count: teamCount } = await supabase
  .from("teams")
  .select("*", { count: "exact", head: true });
const { count: teamMembers } = await supabase
  .from("team_members")
  .select("*", { count: "exact", head: true });
console.log(`Teams: ${teamCount} | team_members: ${teamMembers}`);

// 5. Manager hierarchy
const { count: withManager } = await supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .not("manager_id", "is", null);
console.log(`Users com manager_id: ${withManager ?? "?"}`);

// 6. Objectives + KRs
const { count: okrCount } = await supabase
  .from("objectives")
  .select("*", { count: "exact", head: true });
const { count: krCount } = await supabase
  .from("key_results")
  .select("*", { count: "exact", head: true });
console.log(`Objectives: ${okrCount} | Key Results: ${krCount}`);

// 7. Sample data
console.log("\n=== Sample: Companies ===");
const { data: companies } = await supabase
  .from("companies")
  .select("id, name, slug, plan, created_at")
  .limit(5);
for (const c of companies ?? []) console.log(`  ${c.name} (${c.slug}) plan=${c.plan}`);

console.log("\n=== Sample: Top 5 users (most recent) ===");
const { data: topUsers } = await supabase
  .from("users")
  .select("email, full_name, primary_company_id, created_at")
  .order("created_at", { ascending: false })
  .limit(5);
for (const u of topUsers ?? []) console.log(`  ${u.email} | ${u.full_name}`);

console.log("\n=== Done ===");
