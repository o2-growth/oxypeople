import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { FEEDBACK_INBOX_KEY } from "@/hooks/useFeedbackInbox";

export interface RespondFeedbackInput {
  id: string;
  response: string;
  visibility: string;
  createdAt: string;
}

export function useRespondFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RespondFeedbackInput) => {
      const { error } = await supabase
        .from("feedback_requests")
        .update({
          response: input.response,
          status: "answered",
          answered_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (vars) => {
      const hours =
        (Date.now() - new Date(vars.createdAt).getTime()) / (1000 * 60 * 60);
      trackEvent("feedback_response_submitted", {
        time_to_respond_hours: Math.round(hours * 10) / 10,
        char_count: vars.response.length,
        visibility: vars.visibility,
      });
      toast.success("Resposta enviada");
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_INBOX_KEY] });
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("violates row-level security")) {
        toast.error("Sem permissão para responder este pedido.");
      } else {
        toast.error("Não foi possível enviar a resposta. Tente novamente.");
      }
    },
  });
}
