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

const ORPHAN_EMAILS = [
  "test412e@gmail.com",
  "testejv@gmail.com",
  "jvtestes@gmail.com",
  "testenn@gmail.com",
  "lopesconexoes@gmail.com",
  "andreylopes.ia@gmail.com",
  "jv241004@gmail.com",
];

const { data: orphans } = await supa
  .from("users")
  .select("id, email")
  .in("email", ORPHAN_EMAILS);

console.log(`A apagar ${orphans.length} usuários órfãos (todos com 0 refs verificados).`);

let deletedAuth = 0;
let deletedUsers = 0;
const failures = [];

for (const u of orphans) {
  // Try auth.admin.deleteUser first (cascades to public.users via trigger if exists)
  const { error: authErr } = await supa.auth.admin.deleteUser(u.id);
  if (authErr) {
    console.log(`  ${u.email} → auth.deleteUser falhou: ${authErr.message}; tentando public.users direto`);
    const { error: pubErr } = await supa.from("users").delete().eq("id", u.id);
    if (pubErr) {
      console.log(`  ❌ ${u.email}: ${pubErr.message}`);
      failures.push({ user: u, error: pubErr.message });
      continue;
    }
    deletedUsers++;
  } else {
    deletedAuth++;
    // Confirm public.users also gone (cascade or trigger)
    const { data: stillThere } = await supa.from("users").select("id").eq("id", u.id).maybeSingle();
    if (stillThere) {
      const { error: pubErr } = await supa.from("users").delete().eq("id", u.id);
      if (!pubErr) deletedUsers++;
    } else {
      deletedUsers++;
    }
  }
  console.log(`  ✓ ${u.email}`);
}

console.log(`\nResultado: ${deletedAuth} auth + ${deletedUsers} public.users apagados`);
if (failures.length) {
  console.log(`Falhas: ${failures.length}`);
  for (const f of failures) console.log(`  ${f.user.email}: ${f.error}`);
}

// Verify
const { data: stillOrphans } = await supa
  .from("users")
  .select("id, email, primary_company_id")
  .is("primary_company_id", null);
console.log(`\nÓrfãos restantes: ${stillOrphans?.length ?? 0}`);
for (const u of stillOrphans ?? []) console.log(`  ${u.email}`);
