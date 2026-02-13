import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { subMonths, startOfMonth, endOfMonth, differenceInMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyHeadcount {
  month: string;
  label: string;
  count: number;
  changePercent: number | null;
}

interface DepartmentDistribution {
  name: string;
  color: string;
  count: number;
  growth6m: number;
  growth1y: number;
}

interface HeadcountAnalytics {
  monthlyHeadcount: MonthlyHeadcount[];
  currentTotal: number;
  growth6m: number;
  growth1y: number;
  growth2y: number;
  medianTenureMonths: number;
  departmentDistribution: DepartmentDistribution[];
}

export function useHeadcountAnalytics() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["headcount-analytics", companyId],
    queryFn: async (): Promise<HeadcountAnalytics> => {
      if (!companyId) throw new Error("No company");

      // Fetch all memberships with hire_date
      const { data: memberships, error: mErr } = await supabase
        .from("company_memberships")
        .select("hire_date, status, updated_at, department_id")
        .eq("company_id", companyId);

      if (mErr) throw mErr;

      // Fetch departments
      const { data: departments, error: dErr } = await supabase
        .from("departments")
        .select("id, name, color")
        .eq("company_id", companyId);

      if (dErr) throw dErr;

      const deptMap = new Map(departments?.map(d => [d.id, d]) || []);
      const now = new Date();

      // Calculate monthly headcount for last 24 months
      const monthlyHeadcount: MonthlyHeadcount[] = [];
      for (let i = 23; i >= 0; i--) {
        const targetDate = endOfMonth(subMonths(now, i));
        let count = 0;

        (memberships || []).forEach(m => {
          if (!m.hire_date) return;
          const hireDate = new Date(m.hire_date);
          if (hireDate > targetDate) return; // not hired yet
          
          if (m.status === "active") {
            count++;
          } else if (m.status === "inactive") {
            // Was this person still active at targetDate?
            const leftDate = m.updated_at ? new Date(m.updated_at) : now;
            if (leftDate > targetDate) count++;
          }
        });

        const label = format(targetDate, "MMM yy", { locale: ptBR });
        monthlyHeadcount.push({ month: format(targetDate, "yyyy-MM"), label, count, changePercent: null });
      }

      // Calculate change percentages
      for (let i = 1; i < monthlyHeadcount.length; i++) {
        const prev = monthlyHeadcount[i - 1].count;
        if (prev > 0) {
          monthlyHeadcount[i].changePercent = Math.round(((monthlyHeadcount[i].count - prev) / prev) * 100);
        }
      }

      const currentTotal = monthlyHeadcount[monthlyHeadcount.length - 1]?.count || 0;
      const sixMonthsAgo = monthlyHeadcount[monthlyHeadcount.length - 7]?.count || 0;
      const oneYearAgo = monthlyHeadcount[monthlyHeadcount.length - 13]?.count || 0;
      const twoYearsAgo = monthlyHeadcount[0]?.count || 0;

      const calcGrowth = (old: number, current: number) =>
        old > 0 ? Math.round(((current - old) / old) * 100) : 0;

      // Median tenure
      const tenures = (memberships || [])
        .filter(m => m.status === "active" && m.hire_date)
        .map(m => differenceInMonths(now, new Date(m.hire_date!)))
        .sort((a, b) => a - b);

      const medianTenureMonths = tenures.length > 0
        ? tenures[Math.floor(tenures.length / 2)]
        : 0;

      // Department distribution with growth
      const deptCounts = new Map<string, { current: number; sixMonthsAgo: number; oneYearAgo: number }>();

      departments?.forEach(d => {
        deptCounts.set(d.id, { current: 0, sixMonthsAgo: 0, oneYearAgo: 0 });
      });

      const sixMonthsAgoDate = endOfMonth(subMonths(now, 6));
      const oneYearAgoDate = endOfMonth(subMonths(now, 12));

      (memberships || []).forEach(m => {
        if (!m.department_id || !m.hire_date) return;
        const entry = deptCounts.get(m.department_id);
        if (!entry) return;

        const hireDate = new Date(m.hire_date);
        const leftDate = m.status === "inactive" && m.updated_at ? new Date(m.updated_at) : null;

        // Current
        if (hireDate <= now && (m.status === "active" || (leftDate && leftDate > now))) {
          entry.current++;
        }
        // 6 months ago
        if (hireDate <= sixMonthsAgoDate && (!leftDate || leftDate > sixMonthsAgoDate)) {
          entry.sixMonthsAgo++;
        }
        // 1 year ago
        if (hireDate <= oneYearAgoDate && (!leftDate || leftDate > oneYearAgoDate)) {
          entry.oneYearAgo++;
        }
      });

      const departmentDistribution: DepartmentDistribution[] = [];
      deptCounts.forEach((counts, deptId) => {
        const dept = deptMap.get(deptId);
        if (!dept || counts.current === 0) return;
        departmentDistribution.push({
          name: dept.name,
          color: dept.color || "#3B82F6",
          count: counts.current,
          growth6m: calcGrowth(counts.sixMonthsAgo, counts.current),
          growth1y: calcGrowth(counts.oneYearAgo, counts.current),
        });
      });

      departmentDistribution.sort((a, b) => b.count - a.count);

      return {
        monthlyHeadcount,
        currentTotal,
        growth6m: calcGrowth(sixMonthsAgo, currentTotal),
        growth1y: calcGrowth(oneYearAgo, currentTotal),
        growth2y: calcGrowth(twoYearsAgo, currentTotal),
        medianTenureMonths,
        departmentDistribution,
      };
    },
    enabled: !!companyId,
  });
}
