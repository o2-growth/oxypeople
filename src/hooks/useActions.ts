import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";

export interface Action {
  id: string;
  company_id: string;
  objective_id: string | null;
  key_result_id: string | null;
  title: string;
  description: string | null;
  owner_user_id: string;
  created_by: string;
  status: "todo" | "doing" | "done" | "blocked";
  week_bucket: string;
  order_index: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  objective?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateActionInput {
  title: string;
  description?: string;
  objective_id?: string;
  key_result_id?: string;
  owner_user_id: string;
  status?: "todo" | "doing" | "done" | "blocked";
  week_bucket: string;
  due_date?: string;
}

/** Returns ISO week string like "2026-W06" */
export function getWeekBucket(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Generate array of week buckets for a period */
export function generateWeekBuckets(startDate: Date, endDate: Date): string[] {
  const weeks: string[] = [];
  const current = new Date(startDate);
  // Align to Monday
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);

  while (current <= endDate) {
    weeks.push(getWeekBucket(current));
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

/** Format week bucket to readable label */
export function formatWeekLabel(bucket: string): string {
  const match = bucket.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return bucket;
  return `Semana ${parseInt(match[2])}`;
}

export function useActions(periodWeeks?: string[]) {
  const { user } = useAuth();
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["actions", companyId, periodWeeks],
    queryFn: async (): Promise<Action[]> => {
      if (!companyId || !user?.id) return [];

      let query = supabase
        .from("actions" as any)
        .select(`
          *,
          owner:users!actions_owner_user_id_fkey(id, full_name, avatar_url, email),
          objective:objectives!actions_objective_id_fkey(id, title)
        `)
        .eq("company_id", companyId)
        .order("order_index", { ascending: true });

      if (periodWeeks && periodWeeks.length > 0) {
        query = query.in("week_bucket", periodWeeks);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching actions:", error);
        throw error;
      }
      return (data || []) as unknown as Action[];
    },
    enabled: !!companyId && !!user?.id,
  });
}

export function useCreateAction() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  return useMutation({
    mutationFn: async (input: CreateActionInput) => {
      if (!user?.id || !companyId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("actions" as any)
        .insert({
          company_id: companyId,
          created_by: user.id,
          title: input.title,
          description: input.description || null,
          objective_id: input.objective_id || null,
          key_result_id: input.key_result_id || null,
          owner_user_id: input.owner_user_id,
          status: input.status || "todo",
          week_bucket: input.week_bucket,
          due_date: input.due_date || null,
          order_index: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Action, "title" | "description" | "status" | "week_bucket" | "order_index" | "due_date" | "owner_user_id">>) => {
      const { data, error } = await supabase
        .from("actions" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("actions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });
}
