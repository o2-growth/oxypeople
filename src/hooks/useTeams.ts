import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeams() {
  const { user } = useAuth();
  const { profile } = useUser();

  return useQuery({
    queryKey: ["teams", profile?.primary_company_id],
    queryFn: async (): Promise<Team[]> => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("company_id", profile.primary_company_id)
        .order("name");

      if (error) {
        console.error("Error fetching teams:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!profile?.primary_company_id,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_members")
        .select(`
          id,
          team_id,
          user_id,
          role,
          created_at,
          user:users(id, full_name, email, avatar_url)
        `)
        .eq("team_id", teamId);

      if (error) {
        console.error("Error fetching team members:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { profile } = useUser();

  return useMutation({
    mutationFn: async (team: { name: string; description?: string; department?: string }) => {
      if (!profile?.primary_company_id) throw new Error("No company selected");

      const { data, error } = await supabase
        .from("teams")
        .insert({
          ...team,
          company_id: profile.primary_company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Equipe criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating team:", error);
      toast.error("Erro ao criar equipe");
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Equipe atualizada!");
    },
    onError: (error) => {
      console.error("Error updating team:", error);
      toast.error("Erro ao atualizar equipe");
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Equipe removida!");
    },
    onError: (error) => {
      console.error("Error deleting team:", error);
      toast.error("Erro ao remover equipe");
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId, role = "member" }: { teamId: string; userId: string; role?: string }) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", variables.teamId] });
      toast.success("Membro adicionado à equipe!");
    },
    onError: (error) => {
      console.error("Error adding team member:", error);
      toast.error("Erro ao adicionar membro");
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return teamId;
    },
    onSuccess: (teamId) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Membro removido da equipe!");
    },
    onError: (error) => {
      console.error("Error removing team member:", error);
      toast.error("Erro ao remover membro");
    },
  });
}

export function useCompanyMembers() {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["company-members", profile?.primary_company_id],
    queryFn: async () => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select(`
          id,
          user_id,
          department,
          position,
          user:users(id, full_name, email, avatar_url)
        `)
        .eq("company_id", profile.primary_company_id)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching company members:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user
      }));
    },
    enabled: !!profile?.primary_company_id,
  });
}
