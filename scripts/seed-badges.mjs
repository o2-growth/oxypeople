#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load env
for (const f of [".env.local", ".env"]) {
  try {
    const env = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] ||= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Find primary company (one with most users)
const { data: companies } = await supabase
  .from("companies")
  .select("id, name, slug");
console.log("Companies:", companies);

// Pick the company with most memberships
const { data: countResult } = await supabase
  .from("company_memberships")
  .select("company_id");
const counts = {};
for (const m of countResult ?? []) counts[m.company_id] = (counts[m.company_id] || 0) + 1;
const primaryCompanyId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
console.log("Primary company id:", primaryCompanyId, "with", counts[primaryCompanyId], "members");

const BADGES = [
  { name: "Excelência", description: "Trabalho excepcional acima do esperado", emoji: "⭐", color: "#FFD700", points: 50 },
  { name: "Trabalho em Equipe", description: "Colaboração que destrava o time", emoji: "🤝", color: "#22C55E", points: 30 },
  { name: "Inovação", description: "Ideia ou solução criativa", emoji: "💡", color: "#3B82F6", points: 40 },
  { name: "Liderança", description: "Inspirou e guiou colegas", emoji: "👑", color: "#A855F7", points: 50 },
  { name: "Dedicação", description: "Foco e persistência admiráveis", emoji: "🔥", color: "#EF4444", points: 30 },
  { name: "Comunicação", description: "Comunicação clara e efetiva", emoji: "📢", color: "#06B6D4", points: 25 },
  { name: "Aprendizado Contínuo", description: "Buscou e compartilhou conhecimento", emoji: "📚", color: "#10B981", points: 25 },
  { name: "Foco no Cliente", description: "Resolveu uma dor real do cliente", emoji: "🎯", color: "#F97316", points: 40 },
];

const rows = BADGES.map((b) => ({ ...b, company_id: primaryCompanyId, active: true }));

const { data, error } = await supabase
  .from("badges")
  .upsert(rows, { onConflict: "company_id,name", ignoreDuplicates: true })
  .select();

if (error) {
  console.error("Error inserting badges:", error);
  // Try plain insert if upsert fails
  const { data: data2, error: error2 } = await supabase.from("badges").insert(rows).select();
  if (error2) {
    console.error("Plain insert also failed:", error2);
    process.exit(1);
  }
  console.log("Inserted (plain) badges:", data2?.length);
} else {
  console.log("Upserted badges:", data?.length);
}

const { data: all } = await supabase
  .from("badges")
  .select("name, emoji, points, active")
  .eq("company_id", primaryCompanyId)
  .order("points", { ascending: false });
console.log("\nFinal badges in company:");
for (const b of all ?? []) console.log(`  ${b.emoji} ${b.name} (${b.points}pts)`);
