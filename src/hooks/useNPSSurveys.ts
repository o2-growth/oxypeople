import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import { toast } from "sonner";

export interface NPSSurvey {
  id: string;
  company_id: string;
  created_by: string;
  question: string;
  target_departments: string[];
  target_teams: string[];
  target_all: boolean;
  end_date: string;
  require_comment_below: number | null;
  min_days_employed: number | null;
  status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface NPSResponse {
  id: string;
  survey_id: string;
  user_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface CreateNPSSurveyInput {
  question: string;
  target_departments: string[];
  target_teams: string[];
  target_all: boolean;
  end_date: string;
  require_comment_below: number | null;
  min_days_employed: number | null;
}

export interface SubmitNPSResponseInput {
  survey_id: string;
  score: number;
  comment?: string;
}

export interface NPSMetrics {
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
}

export const calculateNPSMetrics = (responses: { score: number }[]): NPSMetrics => {
  const total = responses.length;
  if (total === 0) {
    return {
      totalResponses: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      npsScore: 0,
      promoterPercent: 0,
      passivePercent: 0,
      detractorPercent: 0,
    };
  }

  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;

  return {
    totalResponses: total,
    promoters,
    passives,
    detractors,
    npsScore: Math.round(((promoters - detractors) / total) * 100),
    promoterPercent: Math.round((promoters / total) * 100),
    passivePercent: Math.round((passives / total) * 100),
    detractorPercent: Math.round((detractors / total) * 100),
  };
};

export function useNPSSurveys() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["nps-surveys", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("nps_surveys")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NPSSurvey[];
    },
    enabled: !!companyId,
  });
}

export function useActiveNPSSurveys() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-nps-surveys", companyId, user?.id],
    queryFn: async () => {
      if (!companyId || !user?.id) return [];

      // Get active surveys
      const { data: surveys, error: surveysError } = await supabase
        .from("nps_surveys")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString().split("T")[0]);

      if (surveysError) throw surveysError;

      // Get user's existing responses
      const { data: responses, error: responsesError } = await supabase
        .from("nps_responses")
        .select("survey_id")
        .eq("user_id", user.id);

      if (responsesError) throw responsesError;

      const respondedSurveyIds = new Set(responses?.map((r) => r.survey_id) || []);

      // Filter out surveys user already responded to
      return (surveys as NPSSurvey[]).filter(
        (survey) => !respondedSurveyIds.has(survey.id)
      );
    },
    enabled: !!companyId && !!user?.id,
  });
}

export function useMyNPSResponses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-nps-responses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("nps_responses")
        .select(`
          *,
          survey:nps_surveys(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useNPSSurveyResults(surveyId: string | null) {
  return useQuery({
    queryKey: ["nps-survey-results", surveyId],
    queryFn: async () => {
      if (!surveyId) return null;

      const { data, error } = await supabase
        .from("nps_responses")
        .select(`
          *,
          user:users(id, full_name, email, avatar_url)
        `)
        .eq("survey_id", surveyId);

      if (error) throw error;
      return data;
    },
    enabled: !!surveyId,
  });
}

export function useAllNPSResults() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["all-nps-results", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Get all surveys with their responses
      const { data: surveys, error: surveysError } = await supabase
        .from("nps_surveys")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (surveysError) throw surveysError;

      // Get all responses for these surveys
      const surveyIds = surveys.map((s) => s.id);
      if (surveyIds.length === 0) return [];

      const { data: responses, error: responsesError } = await supabase
        .from("nps_responses")
        .select(`
          *,
          user:users(id, full_name, email, avatar_url)
        `)
        .in("survey_id", surveyIds);

      if (responsesError) throw responsesError;

      // Group responses by survey
      const surveysWithResponses = surveys.map((survey) => ({
        ...survey,
        responses: responses?.filter((r) => r.survey_id === survey.id) || [],
        metrics: calculateNPSMetrics(
          responses?.filter((r) => r.survey_id === survey.id) || []
        ),
      }));

      return surveysWithResponses;
    },
    enabled: !!companyId,
  });
}

export function useCreateNPSSurvey() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUser();

  return useMutation({
    mutationFn: async (input: CreateNPSSurveyInput) => {
      if (!user?.id || !profile?.primary_company_id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("nps_surveys")
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
      queryClient.invalidateQueries({ queryKey: ["nps-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["active-nps-surveys"] });
      toast.success("Pesquisa NPS criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating NPS survey:", error);
      toast.error("Erro ao criar pesquisa NPS");
    },
  });
}

export function useSubmitNPSResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SubmitNPSResponseInput) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("nps_responses")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-nps-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["my-nps-responses"] });
      queryClient.invalidateQueries({ queryKey: ["nps-survey-results"] });
      queryClient.invalidateQueries({ queryKey: ["all-nps-results"] });
      toast.success("Resposta enviada com sucesso!");
    },
    onError: (error) => {
      console.error("Error submitting NPS response:", error);
      toast.error("Erro ao enviar resposta");
    },
  });
}

export function useUpdateNPSSurveyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      surveyId,
      status,
    }: {
      surveyId: string;
      status: "draft" | "active" | "completed";
    }) => {
      const { data, error } = await supabase
        .from("nps_surveys")
        .update({ status })
        .eq("id", surveyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nps-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["active-nps-surveys"] });
      toast.success("Status da pesquisa atualizado!");
    },
    onError: (error) => {
      console.error("Error updating survey status:", error);
      toast.error("Erro ao atualizar status");
    },
  });
}
