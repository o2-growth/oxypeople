import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface QuarterGoal {
  label: string;
  value: number;
}

export function useQuarterGoals() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["quarter-goals", companyId],
    queryFn: async (): Promise<QuarterGoal[]> => {
      if (!companyId) return [];

      // Get current quarter
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      const currentYear = now.getFullYear();
      const quarterPeriod = `Q${currentQuarter} ${currentYear}`;

      // Get objectives for current quarter or all active ones
      const { data: objectives } = await supabase
        .from("objectives")
        .select("title, progress, tags, department")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!objectives || objectives.length === 0) {
        return [
          { label: "Sem objetivos ativos", value: 0 },
        ];
      }

      // Group by department or tags to create meaningful goals
      const departmentProgress: Record<string, { total: number; count: number }> = {};

      objectives.forEach((obj) => {
        const dept = obj.department || "Geral";
        if (!departmentProgress[dept]) {
          departmentProgress[dept] = { total: 0, count: 0 };
        }
        departmentProgress[dept].total += obj.progress || 0;
        departmentProgress[dept].count += 1;
      });

      const goals = Object.entries(departmentProgress)
        .map(([label, data]) => ({
          label,
          value: Math.round(data.total / data.count),
        }))
        .slice(0, 4); // Limit to 4 goals

      return goals.length > 0 ? goals : [{ label: "Objetivos Gerais", value: Math.round(objectives.reduce((acc, o) => acc + (o.progress || 0), 0) / objectives.length) }];
    },
    enabled: !!companyId,
  });
}
