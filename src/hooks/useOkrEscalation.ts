import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

export interface OkrEscalationCompanyResult {
  companyId: string;
  objectivesScanned: number;
  atRisk: number;
  notificationsCreated: number;
  errors: string[];
}

export interface OkrEscalationReport {
  totalCompanies: number;
  totalObjectivesScanned: number;
  totalAtRisk: number;
  totalNotificationsCreated: number;
  durationMs: number;
  perCompany: OkrEscalationCompanyResult[];
}

interface InvokeResponse {
  success: boolean;
  data: OkrEscalationReport;
  error?: string;
  errors?: string[];
}

export function useOkrEscalation() {
  return useMutation<InvokeResponse, Error, void>({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<InvokeResponse>("okr-escalation", {});
      if (error) throw error;
      if (!data) throw new Error("Edge function retornou resposta vazia.");
      return data;
    },
    onSuccess: (response) => {
      trackEvent("okr_escalation_manual_run", {
        success: response.success,
        notifications_created: response.data?.totalNotificationsCreated ?? 0,
        at_risk: response.data?.totalAtRisk ?? 0,
        duration_ms: response.data?.durationMs ?? 0,
      });
      if (response.success) {
        toast.success(
          `Escalação executada — ${response.data.totalNotificationsCreated} notificações criadas`,
        );
      } else {
        toast.warning("Escalação completada com erros — veja relatório");
      }
    },
    onError: (err) => {
      toast.error(`Falha ao executar: ${err.message}`);
    },
  });
}
