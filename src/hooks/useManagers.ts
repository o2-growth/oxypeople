import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

export interface ManagerMembershipRow {
  id: string;
  user_id: string;
  company_id: string;
  department_id: string | null;
  position: string | null;
  manager_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  manager_name: string | null;
  department_name: string | null;
}

const MANAGERS_QUERY_KEY = "managers-admin";
const ORG_HIERARCHY_KEY = "organization-hierarchy";

function isCycleError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.toLowerCase().includes("manager cycle") ||
    message.toLowerCase().includes("cycle detected")
  );
}

function isSelfManagerError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("company_memberships_no_self_manager");
}

function explainPgError(
  message: string | undefined,
  ctx?: { subordinateName?: string; managerName?: string },
): string {
  if (isCycleError(message)) {
    if (ctx?.subordinateName && ctx?.managerName) {
      return `Não pode criar ciclo: ${ctx.subordinateName} já é gestor de ${ctx.managerName}`;
    }
    return "Não pode criar ciclo na hierarquia.";
  }
  if (isSelfManagerError(message)) {
    return "Uma pessoa não pode ser gestor de si mesma.";
  }
  return message ?? "Erro inesperado. Tente novamente.";
}

export function useManagers() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  const query = useQuery({
    queryKey: [MANAGERS_QUERY_KEY, companyId],
    queryFn: async (): Promise<ManagerMembershipRow[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select(
          `id, user_id, company_id, department_id, position, manager_id,
           user:users!company_memberships_user_id_fkey(id, full_name, email, avatar_url),
           department:departments!company_memberships_department_id_fkey(id, name)`,
        )
        .eq("company_id", companyId)
        .eq("status", "active");

      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<{
        id: string;
        user_id: string;
        company_id: string;
        department_id: string | null;
        position: string | null;
        manager_id: string | null;
        user: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
        department: { id: string; name: string } | null;
      }>;

      const nameById = new Map<string, string>();
      rows.forEach((r) => {
        if (r.user) nameById.set(r.user_id, r.user.full_name || r.user.email);
      });

      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        company_id: r.company_id,
        department_id: r.department_id,
        position: r.position,
        manager_id: r.manager_id,
        full_name: r.user?.full_name || r.user?.email || "Sem nome",
        email: r.user?.email ?? "",
        avatar_url: r.user?.avatar_url ?? null,
        manager_name: r.manager_id ? nameById.get(r.manager_id) ?? null : null,
        department_name: r.department?.name ?? null,
      }));
    },
    enabled: !!companyId,
  });

  const members = useMemo(() => query.data ?? [], [query.data]);

  const membersByUserId = useMemo(() => {
    const map = new Map<string, ManagerMembershipRow>();
    members.forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [MANAGERS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [ORG_HIERARCHY_KEY] });
  };

  const setManagerMutation = useMutation({
    mutationFn: async (input: { userId: string; managerId: string | null }) => {
      if (!companyId) throw new Error("Empresa não identificada.");

      const { data, error } = await supabase
        .from("company_memberships")
        .update({ manager_id: input.managerId })
        .eq("company_id", companyId)
        .eq("user_id", input.userId)
        .select()
        .single();

      if (error) {
        const subordinate = membersByUserId.get(input.userId);
        const manager = input.managerId ? membersByUserId.get(input.managerId) : null;
        throw new Error(
          explainPgError(error.message, {
            subordinateName: subordinate?.full_name,
            managerName: manager?.full_name,
          }),
        );
      }
      return data;
    },
    onSuccess: (_data, vars) => {
      if (vars.managerId) {
        trackEvent("manager_assigned", {
          user_id: vars.userId,
          manager_id: vars.managerId,
        });
        toast.success("Gestor definido");
      } else {
        trackEvent("manager_unassigned", { user_id: vars.userId });
        toast.success("Gestor removido");
      }
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const bulkSetManagerMutation = useMutation({
    mutationFn: async (input: { userIds: string[]; managerId: string | null }) => {
      if (!companyId) throw new Error("Empresa não identificada.");
      if (input.userIds.length === 0) return { updated: 0, failed: [] as string[] };

      const failed: string[] = [];
      let updated = 0;

      for (const userId of input.userIds) {
        const { error } = await supabase
          .from("company_memberships")
          .update({ manager_id: input.managerId })
          .eq("company_id", companyId)
          .eq("user_id", userId);

        if (error) {
          failed.push(userId);
        } else {
          updated += 1;
        }
      }

      return { updated, failed };
    },
    onSuccess: (result, vars) => {
      if (result.updated > 0) {
        if (vars.managerId) {
          trackEvent("manager_assigned", {
            bulk: true,
            count: result.updated,
            manager_id: vars.managerId,
          });
        } else {
          trackEvent("manager_unassigned", { bulk: true, count: result.updated });
        }
      }
      if (result.failed.length === 0) {
        toast.success(`${result.updated} pessoa(s) atualizada(s)`);
      } else if (result.updated === 0) {
        toast.error("Nenhuma atualização — possível ciclo na hierarquia.");
      } else {
        toast.warning(
          `${result.updated} atualizada(s), ${result.failed.length} bloqueada(s) por ciclo.`,
        );
      }
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Expose direct subordinates (one level) per user — used by the page to
  // exclude self + direct reports from the manager picker.
  const directSubordinatesByUserId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    members.forEach((m) => {
      if (m.manager_id) {
        if (!map.has(m.manager_id)) map.set(m.manager_id, new Set());
        map.get(m.manager_id)!.add(m.user_id);
      }
    });
    return map;
  }, [members]);

  return {
    members,
    membersByUserId,
    directSubordinatesByUserId,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    setManager: (userId: string, managerId: string | null) =>
      setManagerMutation.mutateAsync({ userId, managerId }),
    bulkSetManager: (userIds: string[], managerId: string | null) =>
      bulkSetManagerMutation.mutateAsync({ userIds, managerId }),
    isMutating: setManagerMutation.isPending || bulkSetManagerMutation.isPending,
  };
}
