import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { toast } from "sonner";

export interface DeletedItem {
  entity_type: "objective" | "key_result" | "checkin";
  entity_id: string;
  title: string;
  deleted_at: string;
}

export function useDeletedItems() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["deleted-items", companyId],
    queryFn: async (): Promise<DeletedItem[]> => {
      if (!companyId) return [];

      // Fetch deleted objectives
      const { data: objectives = [] } = await supabase
        .from("objectives")
        .select("id, title, deleted_at")
        .eq("company_id", companyId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);

      // Fetch deleted key results
      const { data: krs = [] } = await supabase
        .from("key_results")
        .select("id, title, deleted_at, objective_id")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);

      // Fetch deleted checkins
      const { data: checkins = [] } = await supabase
        .from("okr_checkins")
        .select("id, key_result_id, deleted_at")
        .eq("company_id", companyId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);

      const items: DeletedItem[] = [
        ...objectives.map((o: any) => ({
          entity_type: "objective" as const,
          entity_id: o.id,
          title: o.title,
          deleted_at: o.deleted_at,
        })),
        ...krs.map((kr: any) => ({
          entity_type: "key_result" as const,
          entity_id: kr.id,
          title: kr.title,
          deleted_at: kr.deleted_at,
        })),
        ...checkins.map((c: any) => ({
          entity_type: "checkin" as const,
          entity_id: c.id,
          title: `Check-in ${c.key_result_id?.substring(0, 8)}`,
          deleted_at: c.deleted_at,
        })),
      ];

      items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      return items;
    },
    enabled: !!companyId,
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: string }) => {
      const table = entityType === "objective"
        ? "objectives"
        : entityType === "key_result"
        ? "key_results"
        : "okr_checkins";

      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null } as any)
        .eq("id", entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-items"] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
      toast.success("Item restaurado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao restaurar item.");
    },
  });
}
