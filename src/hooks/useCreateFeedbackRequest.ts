import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import type { FeedbackRequestFormValues } from "@/lib/validation/feedbackRequestSchema";

export function useCreateFeedbackRequest() {
  const queryClient = useQueryClient();
  const { profile } = useUser();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: FeedbackRequestFormValues) => {
      const companyId = profile?.primary_company_id;
      const requesterId = user?.id;
      if (!companyId) throw new Error("Empresa não identificada.");
      if (!requesterId) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("feedback_requests")
        .insert({
          company_id: companyId,
          requester_id: requesterId,
          respondent_id: input.respondent_id,
          subject_user_id: input.subject_user_id,
          question: input.question,
          competency_tags: input.competency_tags,
          visibility: input.visibility,
          due_date: input.due_date && input.due_date.length > 0 ? input.due_date : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      trackEvent("feedback_request_sent", {
        visibility: vars.visibility,
        has_competency_tags: vars.competency_tags.length > 0,
        has_due_date: Boolean(vars.due_date && vars.due_date.length > 0),
      });
      toast.success("Pedido de feedback enviado");
      queryClient.invalidateQueries({ queryKey: ["feedback-sent"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-pending"] });
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("feedback_requester_not_respondent")) {
        toast.error(
          "Você não pode responder seu próprio pedido sobre outra pessoa.",
        );
      } else if (msg.includes("violates row-level security")) {
        toast.error("Sem permissão. Confirme se todos pertencem à empresa.");
      } else {
        toast.error("Não foi possível enviar o pedido. Tente novamente.");
      }
    },
  });
}
