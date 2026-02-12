import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import { ObjectivesFilterState } from "./useObjectivesFilters";
import { toast } from "sonner";

export interface SavedFilter {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  payload: ObjectivesFilterState;
  created_at: string;
}

export function useSavedFilters() {
  const { user } = useAuth();
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;
  const queryClient = useQueryClient();

  const { data: savedFilters = [], isLoading } = useQuery({
    queryKey: ["saved-filters", user?.id, companyId],
    queryFn: async (): Promise<SavedFilter[]> => {
      if (!user?.id || !companyId) return [];

      const { data, error } = await supabase
        .from("saved_filters")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        payload: d.payload as ObjectivesFilterState,
      }));
    },
    enabled: !!user?.id && !!companyId,
  });

  const saveFilter = useMutation({
    mutationFn: async ({ name, payload }: { name: string; payload: ObjectivesFilterState }) => {
      if (!user?.id || !companyId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_filters")
        .insert({
          user_id: user.id,
          company_id: companyId,
          name,
          payload: payload as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters"] });
      toast.success("Filtro salvo com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar filtro.");
    },
  });

  const deleteFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const { error } = await supabase
        .from("saved_filters")
        .delete()
        .eq("id", filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters"] });
      toast.success("Filtro removido.");
    },
  });

  return { savedFilters, isLoading, saveFilter, deleteFilter };
}
