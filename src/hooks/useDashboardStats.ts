import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";

export interface DashboardStats {
  totalCollaborators: number;
  collaboratorsChange: number;
  recognitionsThisMonth: number;
  recognitionsChange: number;
  objectivesCompletionRate: number;
  objectivesChange: number;
  engagementRate: number;
  engagementChange: number;
  postsToday: number;
  completedObjectivesToday: number;
}

export function useDashboardStats() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["dashboard-stats", companyId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!companyId) {
        return {
          totalCollaborators: 0,
          collaboratorsChange: 0,
          recognitionsThisMonth: 0,
          recognitionsChange: 0,
          objectivesCompletionRate: 0,
          objectivesChange: 0,
          engagementRate: 0,
          engagementChange: 0,
          postsToday: 0,
          completedObjectivesToday: 0,
        };
      }

      const now = new Date();
      const thisMonthStart = startOfMonth(now).toISOString();
      const thisMonthEnd = endOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Total collaborators (active members)
      const { count: totalCollaborators } = await supabase
        .from("company_memberships")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active");

      // New hires count (based on is_new_hire flag)
      const { count: newThisMonth } = await supabase
        .from("company_memberships")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active")
        .eq("is_new_hire", true);

      // Recognitions this month
      const { count: recognitionsThisMonth } = await supabase
        .from("recognitions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", thisMonthStart)
        .lte("created_at", thisMonthEnd);

      // Recognitions last month
      const { count: recognitionsLastMonth } = await supabase
        .from("recognitions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd);

      // Objectives stats
      const { data: objectives } = await supabase
        .from("objectives")
        .select("status, progress")
        .eq("company_id", companyId)
        .eq("is_active", true);

      const totalObjectives = objectives?.length || 0;
      const completedObjectives = objectives?.filter(o => o.status === "completed").length || 0;
      const objectivesCompletionRate = totalObjectives > 0 
        ? Math.round((completedObjectives / totalObjectives) * 100) 
        : 0;

      // Posts today
      const { count: postsToday } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      // Calculate engagement (posts + recognitions + comments this month / active users)
      const { count: postsThisMonth } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", thisMonthStart);

      const totalEngagementActions = (recognitionsThisMonth || 0) + (postsThisMonth || 0);
      const engagementRate = totalCollaborators && totalCollaborators > 0
        ? Math.min(100, Math.round((totalEngagementActions / totalCollaborators) * 100))
        : 0;

      // Calculate changes
      const recognitionsChange = recognitionsLastMonth && recognitionsLastMonth > 0
        ? Math.round(((recognitionsThisMonth || 0) - recognitionsLastMonth) / recognitionsLastMonth * 100)
        : 0;

      return {
        totalCollaborators: totalCollaborators || 0,
        collaboratorsChange: newThisMonth || 0,
        recognitionsThisMonth: recognitionsThisMonth || 0,
        recognitionsChange,
        objectivesCompletionRate,
        objectivesChange: 0, // Would need historical data
        engagementRate,
        engagementChange: 0, // Would need historical data
        postsToday: postsToday || 0,
        completedObjectivesToday: completedObjectives,
      };
    },
    enabled: !!companyId,
  });
}
