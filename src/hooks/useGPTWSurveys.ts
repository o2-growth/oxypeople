import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import { toast } from "sonner";
import { GPTW_CATEGORIES } from "@/components/surveys/GPTWQuestions";

export interface GPTWSurvey {
  id: string;
  company_id: string;
  created_by: string;
  target_departments: string[];
  target_teams: string[];
  target_users: string[];
  target_all: boolean;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GPTWResponse {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, number>;
  enps_score: number;
  comment: string | null;
  created_at: string;
}

export interface GPTWDimensionMetrics {
  category: string;
  name: string;
  favorabilityIndex: number;
  totalAnswers: number;
  favorableAnswers: number;
}

export interface GPTWMetrics {
  totalResponses: number;
  overallScore: number;
  dimensions: GPTWDimensionMetrics[];
  enpsScore: number;
}

export function calculateGPTWMetrics(responses: GPTWResponse[]): GPTWMetrics {
  const total = responses.length;
  if (total === 0) {
    return { totalResponses: 0, overallScore: 0, dimensions: [], enpsScore: 0 };
  }

  const scoringCategories = GPTW_CATEGORIES.filter((c) => c.countsForScore);

  const dimensions: GPTWDimensionMetrics[] = scoringCategories.map((cat) => {
    let totalAnswers = 0;
    let favorableAnswers = 0;

    for (const response of responses) {
      for (const q of cat.questions) {
        const val = response.answers[q.id];
        if (val !== undefined) {
          totalAnswers++;
          if (val >= 4) favorableAnswers++;
        }
      }
    }

    return {
      category: cat.id,
      name: cat.name,
      favorabilityIndex: totalAnswers > 0 ? Math.round((favorableAnswers / totalAnswers) * 100) : 0,
      totalAnswers,
      favorableAnswers,
    };
  });

  // Overall = average of the 5 main dimensions (excluding certificacao)
  const mainDimensions = dimensions.filter(
    (d) => d.category !== "certificacao"
  );
  const overallScore =
    mainDimensions.length > 0
      ? Math.round(
          mainDimensions.reduce((sum, d) => sum + d.favorabilityIndex, 0) /
            mainDimensions.length
        )
      : 0;

  // eNPS from gptw responses
  const promoters = responses.filter((r) => r.enps_score >= 9).length;
  const detractors = responses.filter((r) => r.enps_score <= 6).length;
  const enpsScore = Math.round(((promoters - detractors) / total) * 100);

  return { totalResponses: total, overallScore, dimensions, enpsScore };
}

export function useGPTWSurveys() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["gptw-surveys", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("gptw_surveys")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GPTWSurvey[];
    },
    enabled: !!companyId,
  });
}

export function useActiveGPTWSurveys() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-gptw-surveys", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return [];
      const today = new Date().toISOString().split("T")[0];

      const { data: surveys, error } = await supabase
        .from("gptw_surveys")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .gte("end_date", today);

      if (error) throw error;
      if (!surveys || surveys.length === 0) return [];

      const { data: responses } = await supabase
        .from("gptw_responses")
        .select("survey_id")
        .eq("user_id", user.id);

      const respondedIds = new Set(responses?.map((r) => r.survey_id) || []);

      return (surveys as GPTWSurvey[]).filter((s) => {
        if (respondedIds.has(s.id)) return false;
        if (s.target_all) return true;
        if (s.target_users?.includes(user.id)) return true;
        if (
          (!s.target_users || s.target_users.length === 0) &&
          ((s.target_departments?.length ?? 0) > 0 || (s.target_teams?.length ?? 0) > 0)
        )
          return true;
        return false;
      });
    },
    enabled: !!companyId && !!user?.id,
  });
}

export function useGPTWSurveyResponses(surveyId: string | null) {
  return useQuery({
    queryKey: ["gptw-survey-responses", surveyId],
    queryFn: async () => {
      if (!surveyId) return [];
      const { data, error } = await supabase
        .from("gptw_responses")
        .select("*")
        .eq("survey_id", surveyId);
      if (error) throw error;
      return data as GPTWResponse[];
    },
    enabled: !!surveyId,
  });
}

export function useMyGPTWResponses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-gptw-responses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("gptw_responses")
        .select("*, survey:gptw_surveys(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useCreateGPTWSurvey() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUser();

  return useMutation({
    mutationFn: async (input: {
      target_departments: string[];
      target_teams: string[];
      target_users: string[];
      target_all: boolean;
      end_date: string;
    }) => {
      if (!user?.id || !profile?.primary_company_id)
        throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("gptw_surveys")
        .insert({
          ...input,
          company_id: profile.primary_company_id,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gptw-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["active-gptw-surveys"] });
      toast.success("Pesquisa GPTW criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar pesquisa GPTW"),
  });
}

export function useSubmitGPTWResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      survey_id: string;
      answers: Record<string, number>;
      enps_score: number;
      comment?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("gptw_responses")
        .insert({
          survey_id: input.survey_id,
          user_id: user.id,
          answers: input.answers,
          enps_score: input.enps_score,
          comment: input.comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-gptw-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["my-gptw-responses"] });
      queryClient.invalidateQueries({ queryKey: ["gptw-survey-responses"] });
      queryClient.invalidateQueries({ queryKey: ["gptw-surveys"] });
      toast.success("Resposta GPTW enviada com sucesso!");
    },
    onError: () => toast.error("Erro ao enviar resposta GPTW"),
  });
}
