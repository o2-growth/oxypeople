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

const COMPANY_ID = "4a6cdaea-daef-47d2-897f-54d5ae999638"; // o2-growth

const DIRECTORS = [
  "tiago.pisoni@o2inc.com.br",
  "pedro.albite@o2inc.com.br",
  "joao.freitas@o2inc.com.br",
  "rafael.fleck@o2inc.com.br",
];

console.log("Buscando diretores...");
const { data: users } = await supa
  .from("users")
  .select("id, email, full_name, primary_company_id")
  .in("email", DIRECTORS);

console.log("Encontrados:", users?.length);
for (const u of users ?? []) {
  console.log(`  ${u.email} | ${u.full_name} | company=${u.primary_company_id?.slice(0, 8)}`);
}

console.log("\nVerificando roles existentes...");
const { data: existingRoles } = await supa
  .from("user_roles")
  .select("user_id, role, company_id")
  .in("user_id", (users ?? []).map((u) => u.id));

console.log("Roles existentes:", existingRoles);

const toInsert = [];
for (const u of users ?? []) {
  const hasAdmin = existingRoles?.some((r) => r.user_id === u.id && r.role === "admin");
  if (!hasAdmin) {
    toInsert.push({ user_id: u.id, role: "admin", company_id: COMPANY_ID });
  }
}

console.log(`\nA promover: ${toInsert.length} usuário(s)`);
for (const r of toInsert) {
  const u = users.find((x) => x.id === r.user_id);
  console.log(`  - ${u?.email}`);
}

if (toInsert.length === 0) {
  console.log("Nada a fazer.");
  process.exit(0);
}

const { data, error } = await supa.from("user_roles").insert(toInsert).select();
if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}
console.log(`\n✓ Promovidos: ${data?.length ?? 0}`);

// Verify
const { data: finalRoles } = await supa
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "admin");
console.log(`\nTotal admins agora: ${finalRoles?.length}`);
