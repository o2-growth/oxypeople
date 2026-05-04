import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { FEEDBACK_SENT_KEY } from "@/hooks/useFeedbackSent";

export function useDeleteFeedbackRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback_requests").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      trackEvent("feedback_request_cancelled");
      toast.success("Pedido cancelado");
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_SENT_KEY] });
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("violates row-level security")) {
        toast.error("Sem permissão. Pedidos respondidos não podem ser cancelados.");
      } else {
        toast.error("Não foi possível cancelar. Tente novamente.");
      }
    },
  });
}
