import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

export interface PeriodAdminRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  objective_count: number;
}

export interface PeriodInput {
  name: string;
  start_date: string;
  end_date: string;
}

const PERIODS_QUERY_KEY = "periods-admin";
const PERIOD_LIST_KEY = "periods";

function isOverlapError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("overlap") || message.includes("dates overlap");
}

function isInvalidRangeError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("start_date must be before end_date");
}

function explainPgError(message: string | undefined): string {
  if (isOverlapError(message)) return "Período sobrepõe outro período existente.";
  if (isInvalidRangeError(message)) return "Data inicial precisa ser anterior à data final.";
  return message ?? "Erro inesperado. Tente novamente.";
}

export function usePeriodsAdmin() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  const periodsQuery = useQuery({
    queryKey: [PERIODS_QUERY_KEY, companyId],
    queryFn: async (): Promise<PeriodAdminRow[]> => {
      if (!companyId) return [];

      const { data: periods, error } = await supabase
        .from("periods")
        .select("id, name, start_date, end_date, created_at, updated_at")
        .eq("company_id", companyId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      if (!periods || periods.length === 0) return [];

      const periodIds = periods.map((p) => p.id);
      const { data: objectiveRows, error: countErr } = await supabase
        .from("objectives")
        .select("period_id")
        .eq("company_id", companyId)
        .in("period_id", periodIds);

      if (countErr) throw countErr;

      const counts = new Map<string, number>();
      (objectiveRows ?? []).forEach((row) => {
        if (!row.period_id) return;
        counts.set(row.period_id, (counts.get(row.period_id) ?? 0) + 1);
      });

      return periods.map((p) => ({
        ...p,
        objective_count: counts.get(p.id) ?? 0,
      }));
    },
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [PERIODS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PERIOD_LIST_KEY] });
  };

  const createPeriod = useMutation({
    mutationFn: async (input: PeriodInput) => {
      if (!companyId) throw new Error("Empresa não identificada.");
      const { data, error } = await supabase
        .from("periods")
        .insert({
          company_id: companyId,
          name: input.name,
          start_date: input.start_date,
          end_date: input.end_date,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      trackEvent("period_created");
      toast.success("Período criado");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(explainPgError(err.message));
    },
  });

  const updatePeriod = useMutation({
    mutationFn: async (input: PeriodInput & { id: string }) => {
      const { data, error } = await supabase
        .from("periods")
        .update({
          name: input.name,
          start_date: input.start_date,
          end_date: input.end_date,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      trackEvent("period_updated");
      toast.success("Período atualizado");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(explainPgError(err.message));
    },
  });

  const deletePeriod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      trackEvent("period_deleted");
      toast.success("Período removido");
      invalidate();
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("violates foreign key")) {
        toast.error("Período tem objetivos vinculados — desvincule antes de remover.");
        return;
      }
      toast.error(explainPgError(msg));
    },
  });

  return {
    periods: periodsQuery.data ?? [],
    isLoading: periodsQuery.isLoading,
    error: periodsQuery.error as Error | null,
    createPeriod,
    updatePeriod,
    deletePeriod,
  };
}
