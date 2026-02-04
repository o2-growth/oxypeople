import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { toast } from "sonner";
import { startOfMonth, parseISO } from "date-fns";

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  status: "active" | "invited" | "pending" | "inactive";
  position: string | null;
  department: string | null;
  department_id: string | null;
  hire_date: string | null;
  employment_type: string | null;
  is_new_hire: boolean | null;
  joined_at: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  department_info: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  role: "owner" | "admin" | "manager" | "member" | null;
}

export interface PeopleStats {
  total: number;
  active: number;
  newThisMonth: number;
  departments: number;
}

export function usePeopleList() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["people-list", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Fetch memberships with user info
      const { data: memberships, error: membershipsError } = await supabase
        .from("company_memberships")
        .select(`
          *,
          user:users!company_memberships_user_id_fkey(id, full_name, email, avatar_url),
          department_info:departments(id, name, color)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (membershipsError) throw membershipsError;

      // Fetch roles for all users
      const userIds = memberships?.map((m) => m.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("company_id", companyId)
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Map roles to memberships
      const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return memberships?.map((m) => ({
        ...m,
        role: rolesMap.get(m.user_id) || "member",
      })) as CompanyMember[];
    },
    enabled: !!companyId,
  });
}

export function usePeopleStats() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["people-stats", companyId],
    queryFn: async (): Promise<PeopleStats> => {
      if (!companyId) {
        return { total: 0, active: 0, newThisMonth: 0, departments: 0 };
      }

      // Get total and active count
      const { count: total } = await supabase
        .from("company_memberships")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      const { count: active } = await supabase
        .from("company_memberships")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active");

      // Get new this month (based on joined_at or created_at)
      const monthStart = startOfMonth(new Date()).toISOString();
      const { count: newThisMonth } = await supabase
        .from("company_memberships")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", monthStart);

      // Get department count
      const { count: departments } = await supabase
        .from("departments")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      return {
        total: total || 0,
        active: active || 0,
        newThisMonth: newThisMonth || 0,
        departments: departments || 0,
      };
    },
    enabled: !!companyId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { profile } = useUser();

  return useMutation({
    mutationFn: async ({
      emails,
      role,
      newHireData,
    }: {
      emails: string[];
      role: string;
      newHireData?: {
        isNewHire: boolean;
        hireDate?: Date;
        employmentType?: string;
      };
    }) => {
      if (!profile?.primary_company_id) {
        throw new Error("Company not found");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const companyId = profile.primary_company_id;
      const results: { success: string[]; failed: string[] } = {
        success: [],
        failed: [],
      };

      for (const email of emails) {
        try {
          // Create invite record
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const token = crypto.randomUUID();

          const { error: inviteError } = await supabase.from("invites").insert({
            company_id: companyId,
            email: email.toLowerCase().trim(),
            role: role as "owner" | "admin" | "manager" | "member",
            token,
            expires_at: expiresAt.toISOString(),
            invited_by: userData.user.id,
          });

          if (inviteError) {
            console.error("Error creating invite:", inviteError);
            results.failed.push(email);
          } else {
            results.success.push(email);
          }
        } catch (error) {
          console.error("Error inviting:", email, error);
          results.failed.push(email);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["people-list"] });
      queryClient.invalidateQueries({ queryKey: ["people-stats"] });

      if (results.success.length > 0) {
        toast.success(
          `${results.success.length} convite(s) enviado(s) com sucesso!`
        );
      }
      if (results.failed.length > 0) {
        toast.error(`Falha ao enviar ${results.failed.length} convite(s)`);
      }
    },
    onError: (error) => {
      console.error("Error inviting members:", error);
      toast.error("Erro ao enviar convites");
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      status,
    }: {
      membershipId: string;
      status: "active" | "inactive";
    }) => {
      const { error } = await supabase
        .from("company_memberships")
        .update({ status })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people-list"] });
      queryClient.invalidateQueries({ queryKey: ["people-stats"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating member status:", error);
      toast.error("Erro ao atualizar status");
    },
  });
}
