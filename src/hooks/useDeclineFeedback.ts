import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { FEEDBACK_INBOX_KEY } from "@/hooks/useFeedbackInbox";

export interface DeclineFeedbackInput {
  id: string;
  declined_reason: string;
  createdAt: string;
}

export function useDeclineFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeclineFeedbackInput) => {
      const { error } = await supabase
        .from("feedback_requests")
        .update({
          declined_reason: input.declined_reason,
          status: "declined",
        })
        .eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (vars) => {
      const hours =
        (Date.now() - new Date(vars.createdAt).getTime()) / (1000 * 60 * 60);
      trackEvent("feedback_response_declined", {
        time_to_decline_hours: Math.round(hours * 10) / 10,
        reason_length: vars.declined_reason.length,
      });
      toast.success("Pedido recusado");
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_INBOX_KEY] });
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("violates row-level security")) {
        toast.error("Sem permissão para recusar este pedido.");
      } else {
        toast.error("Não foi possível recusar. Tente novamente.");
      }
    },
  });
}
