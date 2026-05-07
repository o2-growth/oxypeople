import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { useAuth } from "@/contexts/AuthContext";
import { toastDbError } from "@/lib/db-errors";

export interface CompanyEvent {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  event_type: string;
  color: string;
  is_recurring: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreateEventInput = {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  event_type: string;
  color?: string;
};

export function useCompanyEvents() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["company-events", companyId],
    queryFn: async (): Promise<CompanyEvent[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_events")
        .select("*")
        .eq("company_id", companyId)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;
      return (data || []) as CompanyEvent[];
    },
    enabled: !!companyId,
  });
}

export function useCreateEvent() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!user?.id || !profile?.primary_company_id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("company_events")
        .insert({
          company_id: profile.primary_company_id,
          created_by: user.id,
          title: input.title,
          description: input.description || null,
          event_date: input.event_date,
          end_date: input.end_date || null,
          location: input.location || null,
          event_type: input.event_type,
          color: input.color || "#3B82F6",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-events"] });
    },
    onError: (err) => toastDbError(err, "Erro ao criar evento"),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("company_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-events"] });
    },
    onError: (err) => toastDbError(err, "Erro ao remover evento"),
  });
}
