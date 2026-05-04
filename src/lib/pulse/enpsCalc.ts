/**
 * eNPS calculator. Convenção:
 *  - 0–6 = Detratores
 *  - 7–8 = Passivos
 *  - 9–10 = Promotores
 *  eNPS = %Promotores - %Detratores  (escala -100 .. +100)
 */
export interface EnpsBreakdown {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  enps: number;
  promotersPct: number;
  passivesPct: number;
  detractorsPct: number;
}

export function calcEnps(scores: number[]): EnpsBreakdown {
  const total = scores.length;
  if (total === 0) {
    return {
      total: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      enps: 0,
      promotersPct: 0,
      passivesPct: 0,
      detractorsPct: 0,
    };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  for (const s of scores) {
    if (s >= 9) promoters += 1;
    else if (s >= 7) passives += 1;
    else detractors += 1;
  }

  const promotersPct = (promoters / total) * 100;
  const passivesPct = (passives / total) * 100;
  const detractorsPct = (detractors / total) * 100;
  const enps = Math.round(promotersPct - detractorsPct);

  return {
    total,
    promoters,
    passives,
    detractors,
    enps,
    promotersPct: Math.round(promotersPct * 10) / 10,
    passivesPct: Math.round(passivesPct * 10) / 10,
    detractorsPct: Math.round(detractorsPct * 10) / 10,
  };
}

export function enpsColor(enps: number): "destructive" | "amber" | "emerald" {
  if (enps < 0) return "destructive";
  if (enps < 30) return "amber";
  return "emerald";
}
