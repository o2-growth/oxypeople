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

console.log("=== 1. Users órfãos (sem primary_company_id) ===");
const { data: orphans } = await supa
  .from("users")
  .select("id, email, full_name, created_at, primary_company_id")
  .is("primary_company_id", null);
for (const u of orphans ?? []) {
  console.log(`  ${u.email.padEnd(40)} ${u.full_name?.padEnd(40) ?? "-"} ${u.created_at}`);
}
console.log(`Total: ${orphans?.length ?? 0}`);

console.log("\n=== 2. Companies (todas) ===");
// Use service role with explicit no-RLS path
const { data: comps, error: compErr } = await supa.from("companies").select("*");
if (compErr) console.log("Error:", compErr);
console.log(`Count: ${comps?.length ?? 0}`);
for (const c of comps ?? []) console.log(`  ${c.id} | ${c.name} | slug=${c.slug} | plan=${c.plan ?? "-"}`);

console.log("\n=== 3. Memberships sample (qual companhia tem mais users) ===");
const { data: memberships } = await supa
  .from("company_memberships")
  .select("user_id, company_id, role");
const byCompany = {};
for (const m of memberships ?? []) {
  byCompany[m.company_id] = (byCompany[m.company_id] || 0) + 1;
}
for (const [cid, count] of Object.entries(byCompany).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cid} -> ${count} users`);
}

console.log("\n=== 4. Objectives — distribuição por owner/company/period ===");
const { data: okrs } = await supa
  .from("objectives")
  .select("id, title, owner_id, company_id, team_id, period_id, objective_type, status, created_at")
  .order("created_at", { ascending: false });
console.log(`Total OKRs: ${okrs?.length ?? 0}`);

const byCompanyOkr = {};
const byTypeOkr = {};
const byStatusOkr = {};
const byPeriodOkr = {};
for (const o of okrs ?? []) {
  byCompanyOkr[o.company_id ?? "null"] = (byCompanyOkr[o.company_id ?? "null"] || 0) + 1;
  byTypeOkr[o.objective_type ?? "null"] = (byTypeOkr[o.objective_type ?? "null"] || 0) + 1;
  byStatusOkr[o.status ?? "null"] = (byStatusOkr[o.status ?? "null"] || 0) + 1;
  byPeriodOkr[o.period_id ?? "null"] = (byPeriodOkr[o.period_id ?? "null"] || 0) + 1;
}
console.log("Por company:", byCompanyOkr);
console.log("Por type:", byTypeOkr);
console.log("Por status:", byStatusOkr);
console.log("Por period_id:", byPeriodOkr);

console.log("\nÚltimos 5 OKRs:");
for (const o of (okrs ?? []).slice(0, 5)) {
  console.log(`  [${o.objective_type ?? "-"}] ${o.title?.slice(0, 60)} (status=${o.status ?? "-"})`);
}

console.log("\n=== 5. Periods existentes ===");
const { data: periods, error: pErr } = await supa
  .from("okr_periods")
  .select("id, name, start_date, end_date, company_id")
  .order("start_date", { ascending: false });
if (pErr) console.log("okr_periods error:", pErr.message);
console.log(`Periods: ${periods?.length ?? 0}`);
for (const p of periods ?? []) console.log(`  ${p.name} ${p.start_date} → ${p.end_date}`);

console.log("\n=== 6. user_roles atuais ===");
const { data: roles } = await supa
  .from("user_roles")
  .select("user_id, role, company_id");
console.log(`Total roles: ${roles?.length ?? 0}`);
const userIds = roles?.map((r) => r.user_id) ?? [];
const { data: usersWithRoles } = await supa
  .from("users")
  .select("id, email, full_name")
  .in("id", userIds);
const byId = Object.fromEntries((usersWithRoles ?? []).map((u) => [u.id, u]));
for (const r of roles ?? []) {
  const u = byId[r.user_id];
  console.log(`  ${r.role.padEnd(10)} ${u?.email ?? r.user_id} (${u?.full_name ?? "-"})`);
}

console.log("\n=== 7. Diretoria — candidatos a admin ===");
const directorEmails = [
  "tiago.pisoni@o2inc.com.br",
  "pedro.albite@o2inc.com.br",
  "joao.freitas@o2inc.com.br",
  "rafael.fleck@o2inc.com.br",
];
const { data: directors } = await supa
  .from("users")
  .select("id, email, full_name, primary_company_id")
  .in("email", directorEmails);
for (const d of directors ?? []) {
  const hasAdminRole = roles?.some((r) => r.user_id === d.id && r.role === "admin");
  console.log(`  ${d.email.padEnd(40)} ${d.full_name?.padEnd(40)} admin=${hasAdminRole ? "YES" : "no"}`);
}
