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

const FROM_COMPANY = "6c864476-a087-408a-b650-a0f9601b9617"; // O2 Inc legacy
const TO_COMPANY = "4a6cdaea-daef-47d2-897f-54d5ae999638"; // o2-growth ativa

console.log(`Migrando dados de O2 Inc (${FROM_COMPANY.slice(0, 8)}) → o2-growth (${TO_COMPANY.slice(0, 8)})\n`);

// 1. Periods first (FK target)
console.log("=== 1. Periods ===");
const { data: legacyPeriods } = await supa
  .from("periods")
  .select("id, name, start_date, end_date")
  .eq("company_id", FROM_COMPANY);
console.log(`Encontrados ${legacyPeriods?.length} periods em O2 Inc:`);
for (const p of legacyPeriods ?? []) console.log(`  ${p.name} (${p.start_date} → ${p.end_date})`);

// Check for overlap with existing in target
const { data: existingPeriods } = await supa
  .from("periods")
  .select("name, start_date, end_date")
  .eq("company_id", TO_COMPANY);
console.log(`\nPeriods já em o2-growth: ${existingPeriods?.length}`);
for (const p of existingPeriods ?? []) console.log(`  ${p.name}`);

// Update period.company_id (UPDATE not DELETE)
const { error: pErr, count: pCount } = await supa
  .from("periods")
  .update({ company_id: TO_COMPANY })
  .eq("company_id", FROM_COMPANY)
  .select("id", { count: "exact" });
if (pErr) {
  console.log(`❌ Periods migration error: ${pErr.message}`);
  console.log("Provavelmente trigger anti-overlap. Tentando renomear primeiro.");
  for (const p of legacyPeriods ?? []) {
    await supa
      .from("periods")
      .update({ name: `[Legacy] ${p.name}`, company_id: TO_COMPANY })
      .eq("id", p.id);
  }
  console.log("Re-tentado com nomes prefixados [Legacy].");
} else {
  console.log(`✓ ${pCount} periods migrados`);
}

// 2. Objectives
console.log("\n=== 2. Objectives ===");
const { data: legacyObj } = await supa
  .from("objectives")
  .select("id, title")
  .eq("company_id", FROM_COMPANY)
  .is("deleted_at", null);
console.log(`Encontrados ${legacyObj?.length} objectives em O2 Inc`);

const { error: oErr, count: oCount } = await supa
  .from("objectives")
  .update({ company_id: TO_COMPANY })
  .eq("company_id", FROM_COMPANY)
  .select("id", { count: "exact" });
if (oErr) {
  console.log(`❌ Objectives migration error: ${oErr.message}`);
} else {
  console.log(`✓ ${oCount} objectives migrados`);
}

// 3. Key Results — herdam via objective_id, mas se tiverem own company_id também
console.log("\n=== 3. Key Results ===");
const { data: krCols } = await supa.from("key_results").select("*").limit(1);
const sample = krCols?.[0];
const hasCompanyCol = sample && "company_id" in sample;
console.log(`Key results têm company_id próprio? ${hasCompanyCol}`);

if (hasCompanyCol) {
  const { error: krErr, count: krCount } = await supa
    .from("key_results")
    .update({ company_id: TO_COMPANY })
    .eq("company_id", FROM_COMPANY)
    .select("id", { count: "exact" });
  if (krErr) {
    console.log(`❌ KR migration error: ${krErr.message}`);
  } else {
    console.log(`✓ ${krCount} KRs migrados`);
  }
} else {
  console.log("KRs herdam da objective (sem ação)");
}

// 4. Verify
console.log("\n=== Verificação final ===");
const { data: byCompany } = await supa
  .from("objectives")
  .select("id, company_id")
  .is("deleted_at", null);
const groups = {};
for (const o of byCompany ?? []) groups[o.company_id] = (groups[o.company_id] || 0) + 1;
console.log("Objectives por company:", groups);

const { data: periodsByCompany } = await supa
  .from("periods")
  .select("id, company_id");
const pGroups = {};
for (const p of periodsByCompany ?? []) pGroups[p.company_id] = (pGroups[p.company_id] || 0) + 1;
console.log("Periods por company:", pGroups);
