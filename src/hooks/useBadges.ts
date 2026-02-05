import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

interface Badge {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  points: number;
  description: string | null;
}

export function useBadges() {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["badges", profile?.primary_company_id],
    queryFn: async (): Promise<Badge[]> => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("badges")
        .select("id, name, emoji, color, points, description")
        .eq("company_id", profile.primary_company_id)
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Error fetching badges:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!profile?.primary_company_id,
  });
}
