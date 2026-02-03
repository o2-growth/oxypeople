import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { startOfWeek, endOfWeek } from "date-fns";

interface TrendingTopic {
  name: string;
  posts: number;
}

export function useTrendingTopics(limit = 4) {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["trending-topics", profile?.primary_company_id, limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      if (!profile?.primary_company_id) return [];

      // Get posts from the current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      const { data: posts, error } = await supabase
        .from("posts")
        .select("content")
        .eq("company_id", profile.primary_company_id)
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd);

      if (error) {
        console.error("Error fetching posts for trending:", error);
        throw error;
      }

      // Extract hashtags from all posts
      const hashtagCounts: Record<string, number> = {};
      const hashtagRegex = /#[\w\u00C0-\u017F]+/gi; // Supports accented characters

      posts?.forEach((post) => {
        const hashtags = post.content.match(hashtagRegex) || [];
        hashtags.forEach((tag) => {
          const normalizedTag = tag.toLowerCase();
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
        });
      });

      // Sort by count and return top N
      const sorted = Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, posts]) => ({ name, posts }));

      return sorted;
    },
    enabled: !!profile?.primary_company_id,
  });
}
