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

// Check current schema of periods
const { data: existing } = await supa
  .from("periods")
  .select("*")
  .eq("company_id", COMPANY_ID)
  .order("start_date", { ascending: false });
console.log(`Periods existentes em o2-growth: ${existing?.length}`);
for (const p of existing ?? []) console.log(`  ${p.name}`);

// Sample structure from O2 Inc to discover schema
const { data: sample } = await supa
  .from("periods")
  .select("*")
  .limit(1)
  .single();
console.log("\nSchema sample:", Object.keys(sample ?? {}));

// Trigger no DB valida anti-overlap → inserir apenas trimestres (sem Anual)
const PERIODS = [
  { name: "OKRs Q1/2026", start_date: "2026-01-01", end_date: "2026-03-31" },
  { name: "OKRs Q2/2026", start_date: "2026-04-01", end_date: "2026-06-30" },
  { name: "OKRs Q3/2026", start_date: "2026-07-01", end_date: "2026-09-30" },
  { name: "OKRs Q4/2026", start_date: "2026-10-01", end_date: "2026-12-31" },
];

const toInsert = PERIODS
  .filter((p) => !existing?.some((e) => e.name === p.name))
  .map((p) => ({ ...p, company_id: COMPANY_ID }));

console.log(`\nA inserir: ${toInsert.length} períodos`);
for (const p of toInsert) console.log(`  - ${p.name} (${p.start_date} → ${p.end_date})`);

if (toInsert.length === 0) {
  console.log("Nada a fazer.");
  process.exit(0);
}

const { data, error } = await supa.from("periods").insert(toInsert).select();
if (error) {
  console.error("ERROR:", error);
  // try without quarter/year if those cols don't exist
  const minimal = toInsert.map(({ quarter, year, ...rest }) => rest);
  const { data: data2, error: e2 } = await supa.from("periods").insert(minimal).select();
  if (e2) {
    console.error("Minimal insert also failed:", e2);
    process.exit(1);
  }
  console.log(`✓ Inseridos (minimal): ${data2?.length}`);
} else {
  console.log(`✓ Inseridos: ${data?.length}`);
}
