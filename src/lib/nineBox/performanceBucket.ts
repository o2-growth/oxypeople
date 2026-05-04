/**
 * Bucketiza um overall_score (0-10) em um eixo de performance da matriz Nine Box (1, 2 ou 3).
 *
 * MVP: thresholds hard-coded (6.0 e 8.0).
 * TODO P2: parametrizar via tabela `nine_box_settings` quando tivermos demanda
 *          de ajuste fino por empresa.
 */
export function performanceBucket(score: number | null | undefined): 1 | 2 | 3 {
  if (score == null || Number.isNaN(score)) return 2; // neutro
  if (score < 6.0) return 1;
  if (score < 8.0) return 2;
  return 3;
}

/**
 * Retorna o nome convencional da célula 3×3 da matriz Nine Box em PT-BR.
 * Eixos: performance ∈ {1,2,3}, potential ∈ {1,2,3}.
 */
export function nineBoxCellName(perf: number, pot: number): string {
  const map: Record<string, string> = {
    "1,1": "Risco",
    "2,1": "Eficaz",
    "3,1": "Especialista",
    "1,2": "Inconsistente",
    "2,2": "Mantenedor",
    "3,2": "Alto Potencial",
    "1,3": "Enigma",
    "2,3": "Crescimento",
    "3,3": "Estrela",
  };
  return map[`${perf},${pot}`] ?? "—";
}

/**
 * Cor visual aproximada de cada célula (Tailwind classes para bg/border).
 * Eixos seguem o mesmo do `nineBoxCellName`.
 */
export function nineBoxCellTheme(perf: number, pot: number): {
  bg: string;
  border: string;
  text: string;
} {
  const key = `${perf},${pot}`;
  const themes: Record<string, { bg: string; border: string; text: string }> = {
    // canto superior direito = melhor
    "3,3": { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-700" },
    "3,2": { bg: "bg-emerald-400/10", border: "border-emerald-400/40", text: "text-emerald-700" },
    "2,3": { bg: "bg-emerald-400/10", border: "border-emerald-400/40", text: "text-emerald-700" },
    "2,2": { bg: "bg-amber-400/10", border: "border-amber-400/40", text: "text-amber-700" },
    "3,1": { bg: "bg-amber-400/10", border: "border-amber-400/40", text: "text-amber-700" },
    "1,3": { bg: "bg-amber-400/10", border: "border-amber-400/40", text: "text-amber-700" },
    "2,1": { bg: "bg-orange-400/10", border: "border-orange-400/40", text: "text-orange-700" },
    "1,2": { bg: "bg-orange-400/10", border: "border-orange-400/40", text: "text-orange-700" },
    "1,1": { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-700" },
  };
  return themes[key] ?? { bg: "bg-muted/40", border: "border-border", text: "text-foreground" };
}
