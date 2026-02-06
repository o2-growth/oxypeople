import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import type { Database } from "@/integrations/supabase/types";

type ObjectiveRow = Database["public"]["Tables"]["objectives"]["Row"];
type KeyResultRow = Database["public"]["Tables"]["key_results"]["Row"];

export interface ObjectiveWithDetails extends ObjectiveRow {
  owner: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  assignee: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  team: {
    id: string;
    name: string;
    department: string | null;
  } | null;
  key_results: KeyResultRow[];
  type: "personal" | "team" | "individual";
  collaborators?: {
    user_id: string;
    role: string;
  }[];
}

export interface CreateObjectiveInput {
  title: string;
  description?: string;
  due_date?: string;
  visibility: "public" | "company" | "private";
  type: "personal" | "team" | "individual";
  team_id?: string;
  assignee_id?: string;
  owner_id?: string;
  parent_id?: string;
  is_active?: boolean;
  period?: string;
  department?: string;
  tags?: string[];
  contributors?: string[];
  editors?: string[];
  key_results?: {
    title: string;
    target_value: number;
    current_value?: number;
    unit?: string;
  }[];
}

export interface UpdateObjectiveInput {
  id: string;
  title?: string;
  description?: string;
  due_date?: string;
  status?: "on-track" | "at-risk" | "off-track" | "completed";
  visibility?: "public" | "company" | "private";
  is_active?: boolean;
  period?: string;
  department?: string;
  tags?: string[];
}

export function useObjectives(filter?: "all" | "personal" | "team" | "company") {
  const { user } = useAuth();
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["objectives", companyId, filter, user?.id],
    queryFn: async (): Promise<ObjectiveWithDetails[]> => {
      if (!companyId || !user?.id) return [];

      let query = supabase
        .from("objectives")
        .select(`
          *,
          owner:users!objectives_owner_id_fkey(id, full_name, avatar_url, email),
          assignee:users!objectives_assignee_id_fkey(id, full_name, avatar_url, email),
          team:teams(id, name, department),
          key_results(*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filter === "personal") {
        query = query.or(`owner_id.eq.${user.id},assignee_id.eq.${user.id}`);
      } else if (filter === "team") {
        query = query.not("team_id", "is", null);
      } else if (filter === "company") {
        query = query.eq("visibility", "company");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching objectives:", error);
        throw error;
      }

      return (data || []).map((obj) => ({
        ...obj,
        type: (obj as any).type as "personal" | "team" | "individual",
      })) as ObjectiveWithDetails[];
    },
    enabled: !!companyId && !!user?.id,
  });
}

export function useCreateObjective() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  return useMutation({
    mutationFn: async (input: CreateObjectiveInput) => {
      if (!user?.id || !companyId) throw new Error("Not authenticated");

      // Determine owner_id based on type and input
      let ownerId = input.owner_id || user.id;
      if (input.type === "individual" && input.assignee_id) {
        ownerId = input.assignee_id;
      }

      // Create objective
      const { data: objective, error: objError } = await supabase
        .from("objectives")
        .insert({
          company_id: companyId,
          owner_id: ownerId,
          created_by: user.id,
          title: input.title,
          description: input.description || null,
          due_date: input.due_date || null,
          visibility: input.visibility,
          type: input.type,
          team_id: input.team_id || null,
          assignee_id: input.assignee_id || null,
          parent_id: input.parent_id || null,
          is_active: input.is_active ?? true,
          period: input.period || null,
          department: input.department || null,
          tags: input.tags || null,
          status: "on-track",
          progress: 0,
        })
        .select()
        .single();

      if (objError) throw objError;

      // Create key results if provided
      if (input.key_results && input.key_results.length > 0) {
        const keyResultsData = input.key_results.map((kr) => ({
          objective_id: objective.id,
          title: kr.title,
          target_value: kr.target_value,
          current_value: kr.current_value || 0,
          unit: kr.unit || "%",
        }));

        const { error: krError } = await supabase
          .from("key_results")
          .insert(keyResultsData);

        if (krError) throw krError;
      }

      // Create collaborators (contributors and editors)
      const collaborators: { objective_id: string; user_id: string; role: string }[] = [];

      if (input.contributors && input.contributors.length > 0) {
        input.contributors.forEach((userId) => {
          collaborators.push({
            objective_id: objective.id,
            user_id: userId,
            role: "contributor",
          });
        });
      }

      if (input.editors && input.editors.length > 0) {
        input.editors.forEach((userId) => {
          collaborators.push({
            objective_id: objective.id,
            user_id: userId,
            role: "editor",
          });
        });
      }

      if (collaborators.length > 0) {
        const { error: collabError } = await supabase
          .from("objective_collaborators")
          .insert(collaborators);

        if (collabError) {
          console.error("Error creating collaborators:", collabError);
          // Don't throw - objective was created successfully
        }
      }

      return objective;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}

export function useUpdateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateObjectiveInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("objectives")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (objectiveId: string) => {
      const { error } = await supabase
        .from("objectives")
        .delete()
        .eq("id", objectiveId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      current_value,
    }: {
      id: string;
      current_value: number;
    }) => {
      const { data, error } = await supabase
        .from("key_results")
        .update({ current_value })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}

export function useObjectiveStats() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["objective-stats", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("objectives")
        .select("status, is_active")
        .eq("company_id", companyId);

      if (error) throw error;

      const activeObjectives = (data || []).filter((o: any) => o.is_active !== false);

      const stats = {
        total: activeObjectives.length,
        onTrack: activeObjectives.filter((o: any) => o.status === "on-track").length,
        atRisk: activeObjectives.filter((o: any) => o.status === "at-risk").length,
        offTrack: activeObjectives.filter((o: any) => o.status === "off-track").length,
        completed: activeObjectives.filter((o: any) => o.status === "completed").length,
      };

      return stats;
    },
    enabled: !!companyId,
  });
}
