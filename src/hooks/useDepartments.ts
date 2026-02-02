import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface Department {
  name: string;
  teamCount: number;
}

export function useDepartments() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["departments", companyId],
    queryFn: async (): Promise<Department[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("department")
        .eq("company_id", companyId)
        .not("department", "is", null);

      if (error) throw error;

      // Group by department and count
      const deptMap = new Map<string, number>();
      (data || []).forEach((team) => {
        if (team.department) {
          deptMap.set(team.department, (deptMap.get(team.department) || 0) + 1);
        }
      });

      return Array.from(deptMap.entries())
        .map(([name, teamCount]) => ({ name, teamCount }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!companyId,
  });
}
