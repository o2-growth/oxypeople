import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: Date;
  type: "recognition" | "objective" | "post" | "survey";
}

export function useRecentActivity(limit = 5) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["recent-activity", companyId, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!companyId) return [];

      const activities: ActivityItem[] = [];

      // Get recent recognitions
      const { data: recognitions } = await supabase
        .from("recognitions")
        .select(`
          id,
          created_at,
          from_user:users!recognitions_from_user_id_fkey(full_name, avatar_url),
          to_user:users!recognitions_to_user_id_fkey(full_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit);

      recognitions?.forEach((r) => {
        activities.push({
          id: `recognition-${r.id}`,
          user: {
            name: r.from_user?.full_name || "Usuário",
            avatar: r.from_user?.avatar_url || undefined,
          },
          action: "reconheceu",
          target: r.to_user?.full_name || "Colega",
          timestamp: new Date(r.created_at),
          type: "recognition",
        });
      });

      // Get recent posts
      const { data: posts } = await supabase
        .from("posts")
        .select(`
          id,
          created_at,
          author:users!posts_author_id_fkey(full_name, avatar_url)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit);

      posts?.forEach((p) => {
        activities.push({
          id: `post-${p.id}`,
          user: {
            name: p.author?.full_name || "Usuário",
            avatar: p.author?.avatar_url || undefined,
          },
          action: "publicou uma atualização no feed",
          timestamp: new Date(p.created_at),
          type: "post",
        });
      });

      // Get recent completed objectives
      const { data: objectives } = await supabase
        .from("objectives")
        .select(`
          id,
          title,
          updated_at,
          owner:users!objectives_owner_id_fkey(full_name, avatar_url)
        `)
        .eq("company_id", companyId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(limit);

      objectives?.forEach((o) => {
        activities.push({
          id: `objective-${o.id}`,
          user: {
            name: o.owner?.full_name || "Usuário",
            avatar: o.owner?.avatar_url || undefined,
          },
          action: "completou o objetivo",
          target: o.title,
          timestamp: new Date(o.updated_at),
          type: "objective",
        });
      });

      // Get recent NPS responses
      const { data: npsResponses } = await supabase
        .from("nps_responses")
        .select(`
          id,
          created_at,
          user:users!nps_responses_user_id_fkey(full_name, avatar_url),
          survey:nps_surveys!nps_responses_survey_id_fkey(question)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      npsResponses?.forEach((n) => {
        activities.push({
          id: `nps-${n.id}`,
          user: {
            name: n.user?.full_name || "Usuário",
            avatar: n.user?.avatar_url || undefined,
          },
          action: "respondeu a pesquisa",
          target: "NPS",
          timestamp: new Date(n.created_at),
          type: "survey",
        });
      });

      // Sort by timestamp and return top items
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    },
    enabled: !!companyId,
  });
}
