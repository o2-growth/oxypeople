/**
 * Calcula a data de "início do período" para um Pulse Survey, dada uma frequência
 * e configurações de dia. Retorna ISO date (YYYY-MM-DD).
 *
 * - weekly: âncora no `day_of_week` (0=Dom, 1=Seg ... 6=Sab) mais recente.
 * - biweekly: igual a weekly, mas alinhado ao bucket par/ímpar contado desde
 *   uma data de referência (createdAt) — para alternar semanas A/B previsivelmente.
 * - monthly: dia do mês configurado (1–28). Se ainda não chegou neste mês,
 *   pega o mesmo dia do mês anterior.
 */
export function periodStartFor(
  now: Date,
  frequency: "weekly" | "biweekly" | "monthly",
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  createdAt?: Date,
): string {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);

  if (frequency === "monthly") {
    const target = clamp(dayOfMonth ?? 1, 1, 28);
    d.setUTCDate(target);
    if (d.getTime() > now.getTime()) {
      d.setUTCMonth(d.getUTCMonth() - 1);
    }
    return toIsoDate(d);
  }

  // weekly / biweekly — anchor no dayOfWeek mais recente (default: segunda)
  const target = clamp(dayOfWeek ?? 1, 0, 6);
  const diff = (d.getUTCDay() - target + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);

  if (frequency === "biweekly") {
    const reference = createdAt ?? new Date(0);
    const refAligned = new Date(reference);
    refAligned.setUTCHours(0, 0, 0, 0);
    const refDiff = (refAligned.getUTCDay() - target + 7) % 7;
    refAligned.setUTCDate(refAligned.getUTCDate() - refDiff);

    const weeks = Math.floor((d.getTime() - refAligned.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeks % 2 !== 0) {
      d.setUTCDate(d.getUTCDate() - 7);
    }
  }

  return toIsoDate(d);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Chave de localStorage para "ack" anti-duplicação client-side de pulse anônimo.
 */
export function pulseAckKey(pulseId: string, periodStart: string): string {
  return `oxypeople:pulse-ack:${pulseId}:${periodStart}`;
}
