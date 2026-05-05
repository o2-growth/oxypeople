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

const { data: allRoles } = await supa
  .from("user_roles")
  .select("id, user_id, role, company_id, created_at")
  .order("created_at", { ascending: true });

console.log(`Total user_roles: ${allRoles?.length}`);

// group by user_id+role+company_id
const groups = {};
for (const r of allRoles ?? []) {
  const key = `${r.user_id}|${r.role}|${r.company_id ?? "null"}`;
  (groups[key] ||= []).push(r);
}

console.log("\nDuplicates encontrados:");
let hasDup = false;
for (const [key, items] of Object.entries(groups)) {
  if (items.length > 1) {
    hasDup = true;
    console.log(`  ${key} → ${items.length} entries`);
    for (const it of items) console.log(`     id=${it.id} created=${it.created_at}`);
  }
}
if (!hasDup) console.log("  Nenhum duplicate exato.");

// All roles with user info
const userIds = [...new Set((allRoles ?? []).map((r) => r.user_id))];
const { data: users } = await supa
  .from("users")
  .select("id, email, full_name")
  .in("id", userIds);
const byId = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

console.log("\nTodas as roles atuais:");
for (const r of allRoles ?? []) {
  const u = byId[r.user_id];
  console.log(`  ${r.role.padEnd(10)} ${u?.email ?? r.user_id} company=${r.company_id?.slice(0, 8) ?? "null"}`);
}
