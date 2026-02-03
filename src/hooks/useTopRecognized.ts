import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { startOfMonth, endOfMonth } from "date-fns";

interface TopRecognizedUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  recognitions_count: number;
}

export function useTopRecognized(limit = 3) {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["top-recognized", profile?.primary_company_id, limit],
    queryFn: async (): Promise<TopRecognizedUser[]> => {
      if (!profile?.primary_company_id) return [];

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Fetch recognitions for the current month
      const { data: recognitions, error } = await supabase
        .from("recognitions")
        .select(`
          to_user_id,
          users!recognitions_to_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("company_id", profile.primary_company_id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);

      if (error) {
        console.error("Error fetching recognitions:", error);
        throw error;
      }

      // Count recognitions per user
      const userCounts: Record<string, { 
        user_id: string;
        full_name: string | null; 
        avatar_url: string | null; 
        count: number 
      }> = {};

      recognitions?.forEach((rec) => {
        const user = rec.users as { id: string; full_name: string | null; avatar_url: string | null } | null;
        if (!user) return;
        
        if (!userCounts[user.id]) {
          userCounts[user.id] = {
            user_id: user.id,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            count: 0,
          };
        }
        userCounts[user.id].count++;
      });

      // Sort by count and return top N
      const sorted = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((u) => ({
          user_id: u.user_id,
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          recognitions_count: u.count,
        }));

      return sorted;
    },
    enabled: !!profile?.primary_company_id,
  });
}
