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

console.log("=== A. Count direto via head ===");
const { count: c1 } = await supa.from("objectives").select("*", { count: "exact", head: true });
console.log(`HEAD count: ${c1}`);

console.log("\n=== B. Select sem filtro com paginação ===");
const { data: all, error: e1 } = await supa
  .from("objectives")
  .select("id, title, company_id, deleted_at")
  .limit(50);
console.log(`Returned: ${all?.length ?? 0}, Error: ${e1?.message ?? "none"}`);

console.log("\n=== C. Count incluindo deleted ===");
const { count: c2 } = await supa
  .from("objectives")
  .select("*", { count: "exact", head: true })
  .not("deleted_at", "is", null);
console.log(`Soft-deleted: ${c2}`);

const { count: c3 } = await supa
  .from("objectives")
  .select("*", { count: "exact", head: true })
  .is("deleted_at", null);
console.log(`Active (not deleted): ${c3}`);

console.log("\n=== D. Por company ===");
const { data: byComp } = await supa
  .from("objectives")
  .select("id, title, company_id")
  .is("deleted_at", null);
const groups = {};
for (const o of byComp ?? []) {
  groups[o.company_id ?? "null"] = (groups[o.company_id ?? "null"] || 0) + 1;
}
console.log(groups);

console.log("\n=== E. Sample first 10 ===");
for (const o of (byComp ?? []).slice(0, 10)) {
  console.log(`  [${o.company_id?.slice(0, 8)}] ${o.title?.slice(0, 60)}`);
}

console.log("\n=== F. Claude Smoke Test profile ===");
const { data: claude } = await supa
  .from("users")
  .select("id, email, primary_company_id")
  .eq("email", "smoke-test+claude@o2inc.com.br")
  .single();
console.log(claude);

console.log("\n=== G. periods table sample ===");
const { data: periods, error: pErr } = await supa
  .from("periods")
  .select("*")
  .order("start_date", { ascending: false })
  .limit(5);
if (pErr) console.log("Error:", pErr.message);
for (const p of periods ?? []) console.log(`  ${p.name} (${p.id}) ${p.start_date} → ${p.end_date} | company=${p.company_id?.slice(0, 8)}`);
