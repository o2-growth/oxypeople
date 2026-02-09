import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";

export interface CheckinInput {
  key_result_id: string;
  objective_id: string;
  previous_value: number;
  new_value: number;
  comment: string;
  perceived_risk: "green" | "yellow" | "red";
  has_blocker: boolean;
  blocker_description?: string;
}

export interface Checkin {
  id: string;
  key_result_id: string;
  objective_id: string;
  company_id: string;
  user_id: string;
  previous_value: number;
  new_value: number;
  comment: string;
  perceived_risk: string;
  has_blocker: boolean;
  blocker_description: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export function useCheckins(keyResultId?: string) {
  const { user } = useAuth();
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["checkins", keyResultId],
    queryFn: async (): Promise<Checkin[]> => {
      if (!keyResultId || !companyId) return [];

      const { data, error } = await supabase
        .from("okr_checkins")
        .select(`
          *,
          user:users!okr_checkins_user_id_fkey(id, full_name, avatar_url, email)
        `)
        .eq("key_result_id", keyResultId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as Checkin[];
    },
    enabled: !!keyResultId && !!companyId,
  });
}

export function useCreateCheckin() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  return useMutation({
    mutationFn: async (input: CheckinInput) => {
      if (!user?.id || !companyId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("okr_checkins")
        .insert({
          key_result_id: input.key_result_id,
          objective_id: input.objective_id,
          company_id: companyId,
          user_id: user.id,
          previous_value: input.previous_value,
          new_value: input.new_value,
          comment: input.comment,
          perceived_risk: input.perceived_risk,
          has_blocker: input.has_blocker,
          blocker_description: input.blocker_description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checkins", variables.key_result_id] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}

export function useOkrSettings() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["okr-settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("okr_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useUpdateOkrSettings() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  return useMutation({
    mutationFn: async (settings: {
      checkin_frequency?: string;
      checkin_min_chars?: number;
      deviation_attention_pct?: number;
      deviation_risk_pct?: number;
      checkin_overdue_days?: number;
      risk_days_before_escalation?: number;
    }) => {
      if (!companyId) throw new Error("No company");

      const { data, error } = await supabase
        .from("okr_settings")
        .upsert({
          company_id: companyId,
          ...settings,
        }, { onConflict: "company_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okr-settings"] });
    },
  });
}

export function useAuditLog(entityId?: string) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["okr-audit-log", entityId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("okr_audit_log")
        .select(`
          *,
          changed_by_user:users!okr_audit_log_changed_by_fkey(id, full_name, avatar_url, email)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}
