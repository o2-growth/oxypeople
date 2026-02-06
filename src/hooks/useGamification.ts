import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface GamificationPoint {
  id: string;
  user_id: string;
  company_id: string;
  action_type: string;
  points: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface UserRanking {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  rank: number;
  level: GamificationLevel;
}

export interface GamificationLevel {
  name: string;
  min_points: number;
  max_points: number;
  badge_emoji: string;
  color: string;
}

// Default levels (can be customized per company later)
export const DEFAULT_LEVELS: GamificationLevel[] = [
  { name: "Bronze", min_points: 0, max_points: 99, badge_emoji: "🥉", color: "#CD7F32" },
  { name: "Prata", min_points: 100, max_points: 499, badge_emoji: "🥈", color: "#C0C0C0" },
  { name: "Ouro", min_points: 500, max_points: 999, badge_emoji: "🥇", color: "#FFD700" },
  { name: "Platina", min_points: 1000, max_points: 2499, badge_emoji: "💎", color: "#E5E4E2" },
  { name: "Diamante", min_points: 2500, max_points: Infinity, badge_emoji: "👑", color: "#B9F2FF" },
];

export const ACTION_POINTS: Record<string, { points: number; description: string }> = {
  post: { points: 5, description: "Criou um post no feed" },
  comment: { points: 2, description: "Comentou em um post" },
  reaction: { points: 1, description: "Reagiu a um post" },
  recognition_sent: { points: 10, description: "Enviou um reconhecimento" },
  recognition_received: { points: 15, description: "Recebeu um reconhecimento" },
  objective_completed: { points: 20, description: "Completou um objetivo" },
  key_result_updated: { points: 3, description: "Atualizou um resultado-chave" },
  nps_response: { points: 5, description: "Respondeu pesquisa NPS" },
  daily_login: { points: 2, description: "Login diário" },
};

export function getLevelForPoints(points: number): GamificationLevel {
  for (let i = DEFAULT_LEVELS.length - 1; i >= 0; i--) {
    if (points >= DEFAULT_LEVELS[i].min_points) {
      return DEFAULT_LEVELS[i];
    }
  }
  return DEFAULT_LEVELS[0];
}

export function getNextLevel(currentLevel: GamificationLevel): GamificationLevel | null {
  const currentIndex = DEFAULT_LEVELS.findIndex(l => l.name === currentLevel.name);
  if (currentIndex < DEFAULT_LEVELS.length - 1) {
    return DEFAULT_LEVELS[currentIndex + 1];
  }
  return null;
}

export function useUserPoints() {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["gamification-points", "user", profile?.id],
    queryFn: async (): Promise<{ total: number; history: GamificationPoint[] }> => {
      if (!profile?.id || !profile?.primary_company_id) {
        return { total: 0, history: [] };
      }

      const { data, error } = await supabase
        .from("gamification_points")
        .select("*")
        .eq("user_id", profile.id)
        .eq("company_id", profile.primary_company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const total = (data || []).reduce((sum, p) => sum + p.points, 0);
      return { total, history: data || [] };
    },
    enabled: !!profile?.id && !!profile?.primary_company_id,
  });
}

export function useCompanyRanking(period?: "month" | "quarter" | "all") {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["gamification-ranking", profile?.primary_company_id, period],
    queryFn: async (): Promise<UserRanking[]> => {
      if (!profile?.primary_company_id) return [];

      let query = supabase
        .from("gamification_points")
        .select("user_id, points, created_at")
        .eq("company_id", profile.primary_company_id);

      // Apply period filter
      if (period === "month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startOfMonth.toISOString());
      } else if (period === "quarter") {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        query = query.gte("created_at", startOfQuarter.toISOString());
      }

      const { data: points, error: pointsError } = await query;
      if (pointsError) throw pointsError;

      // Aggregate points by user
      const userPoints: Record<string, number> = {};
      (points || []).forEach((p) => {
        userPoints[p.user_id] = (userPoints[p.user_id] || 0) + p.points;
      });

      // Get user info for all users with points
      const userIds = Object.keys(userPoints);
      if (userIds.length === 0) return [];

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Build ranking
      const ranking: UserRanking[] = (users || [])
        .map((user) => ({
          user_id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          total_points: userPoints[user.id] || 0,
          rank: 0,
          level: getLevelForPoints(userPoints[user.id] || 0),
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      return ranking;
    },
    enabled: !!profile?.primary_company_id,
  });
}

export function usePointsHistory(limit = 20) {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["gamification-history", profile?.id, limit],
    queryFn: async (): Promise<GamificationPoint[]> => {
      if (!profile?.id || !profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("gamification_points")
        .select("*")
        .eq("user_id", profile.id)
        .eq("company_id", profile.primary_company_id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && !!profile?.primary_company_id,
  });
}

export function useAddPoints() {
  const { profile } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionType,
      referenceId,
      customDescription,
    }: {
      actionType: keyof typeof ACTION_POINTS;
      referenceId?: string;
      customDescription?: string;
    }) => {
      if (!profile?.id || !profile?.primary_company_id) {
        throw new Error("User not authenticated");
      }

      const actionConfig = ACTION_POINTS[actionType];
      if (!actionConfig) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      const { data, error } = await supabase
        .from("gamification_points")
        .insert({
          user_id: profile.id,
          company_id: profile.primary_company_id,
          action_type: actionType,
          points: actionConfig.points,
          reference_id: referenceId || null,
          description: customDescription || actionConfig.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification-points"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-ranking"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-history"] });
    },
  });
}

export function useAddPointsForUser() {
  const { profile } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      actionType,
      referenceId,
      customDescription,
    }: {
      userId: string;
      actionType: keyof typeof ACTION_POINTS;
      referenceId?: string;
      customDescription?: string;
    }) => {
      if (!profile?.primary_company_id) {
        throw new Error("Company not found");
      }

      const actionConfig = ACTION_POINTS[actionType];
      if (!actionConfig) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      const { data, error } = await supabase
        .from("gamification_points")
        .insert({
          user_id: userId,
          company_id: profile.primary_company_id,
          action_type: actionType,
          points: actionConfig.points,
          reference_id: referenceId || null,
          description: customDescription || actionConfig.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification-points"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-ranking"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-history"] });
    },
  });
}
