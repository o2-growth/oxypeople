import { toast } from "sonner";

/**
 * Maps Supabase / Postgres error messages to user-friendly pt-BR strings.
 * Keep matching loose (substring) so it survives minor wording shifts in triggers.
 */

interface ErrorLike {
  message?: unknown;
  error_description?: unknown;
  details?: unknown;
}

function extractMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as ErrorLike;
    if (typeof e.message === "string") return e.message;
    if (typeof e.error_description === "string") return e.error_description;
    if (typeof e.details === "string") return e.details;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const MAPPINGS: Array<{ match: string | RegExp; pt: string }> = [
  // Hierarchy / type rules
  { match: "Tactical objectives can only have operational children", pt: "Objetivos táticos só aceitam filhos operacionais." },
  { match: "Strategic objectives can only have tactical or operational children", pt: "Objetivos estratégicos só aceitam filhos táticos ou operacionais." },
  { match: "Cannot create child objectives under operational objectives", pt: "Objetivos operacionais não podem ter filhos." },
  { match: "Key Results can only be added to operational objectives", pt: "Resultados-chave só podem ser adicionados a objetivos operacionais." },

  // Weights
  { match: "KR weights must sum to 100", pt: "Os pesos dos KRs devem somar 100%." },
  { match: "Child objective weights must sum to 100", pt: "Os pesos dos filhos devem somar 100%." },

  // Check-ins
  { match: "Check-in comment must have at least", pt: "O comentário do check-in é muito curto." },
  { match: "Check-ins can only be done on operational objectives", pt: "Check-ins só são permitidos em objetivos operacionais." },

  // Periods
  { match: "Period dates overlap with existing period", pt: "As datas do período se sobrepõem a outro período existente." },
  { match: "period_start must be before period_end", pt: "Data inicial deve ser anterior à final." },
  { match: "start_date must be before end_date", pt: "Data inicial deve ser anterior à final." },

  // Manager hierarchy
  { match: "Manager cycle detected", pt: "Ciclo de gestão detectado: o usuário não pode reportar a alguém abaixo dele." },

  // Permissions
  { match: "violates row-level security policy", pt: "Você não tem permissão para essa ação." },
  { match: "permission denied", pt: "Você não tem permissão para essa ação." },

  // Uniqueness
  { match: "duplicate key value violates unique constraint", pt: "Esse registro já existe." },
];

export function friendlyDbError(err: unknown): string {
  const raw = extractMessage(err).trim();
  if (!raw) return "Ocorreu um erro inesperado.";

  for (const { match, pt } of MAPPINGS) {
    if (typeof match === "string") {
      if (raw.includes(match)) return pt;
    } else if (match.test(raw)) {
      return pt;
    }
  }

  return raw;
}

export function toastDbError(err: unknown, contextLabel?: string): void {
  const friendly = friendlyDbError(err);
  if (contextLabel) {
    toast.error(`${contextLabel}: ${friendly}`);
  } else {
    toast.error(friendly);
  }
}
