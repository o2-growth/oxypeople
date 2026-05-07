import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export type OkrAccessLevel = "manager" | "contributor" | "restricted";

export interface OkrAccessLevelRow {
  id: string;
  user_id: string;
  position: string | null;
  department: string | null;
  status: string;
  okr_access_level: OkrAccessLevel;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

const OKR_ACCESS_QUERY_KEY = "okr-access-levels";

export function useOkrAccessLevels() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  const query = useQuery({
    queryKey: [OKR_ACCESS_QUERY_KEY, companyId],
    queryFn: async (): Promise<OkrAccessLevelRow[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select(
          `id, user_id, position, department, status, okr_access_level,
           user:users!company_memberships_user_id_fkey(id, full_name, email, avatar_url),
           dept:departments!company_memberships_department_id_fkey(id, name)`,
        )
        .eq("company_id", companyId);

      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<{
        id: string;
        user_id: string;
        position: string | null;
        department: string | null;
        status: string;
        okr_access_level: OkrAccessLevel | null;
        user: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
        dept: { id: string; name: string } | null;
      }>;

      return rows
        .filter((r) => r.status !== "inactive")
        .map((r) => ({
          id: r.id,
          user_id: r.user_id,
          position: r.position,
          department: r.dept?.name ?? r.department,
          status: r.status,
          okr_access_level: (r.okr_access_level ?? "contributor") as OkrAccessLevel,
          full_name: r.user?.full_name || r.user?.email || "Sem nome",
          email: r.user?.email ?? "",
          avatar_url: r.user?.avatar_url ?? null,
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: !!companyId,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const byUserId = useMemo(() => {
    const map = new Map<string, OkrAccessLevelRow>();
    rows.forEach((r) => map.set(r.user_id, r));
    return map;
  }, [rows]);

  return {
    rows,
    byUserId,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}

export function useUpdateOkrAccessLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { membershipId: string; level: OkrAccessLevel }) => {
      // Generated types lag behind the new column; narrow override keeps key safety.
      const payload: { okr_access_level: OkrAccessLevel } = { okr_access_level: input.level };
      const { error } = await supabase
        .from("company_memberships")
        .update(payload as unknown as { okr_access_level: string })
        .eq("id", input.membershipId);

      if (error) throw error;
      return input;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKR_ACCESS_QUERY_KEY] });
      toast.success("Nível de acesso atualizado");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
