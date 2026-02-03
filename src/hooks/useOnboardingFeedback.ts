import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface OnboardingFeedback {
  id: string;
  company_id: string;
  user_id: string;
  manager_id: string | null;
  status: "pending" | "completed" | "expired";
  due_date: string;
  completed_at: string | null;
  overall_rating: number | null;
  positive_surprise: string | null;
  integration_level: string | null;
  has_all_access: boolean | null;
  missing_access: string | null;
  tools_ease_rating: number | null;
  training_rating: number | null;
  clarity_level: string | null;
  difficulties: string | null;
  complicated_tools: string | null;
  onboarding_rating: number | null;
  what_worked_well: string | null;
  improvement_suggestions: string | null;
  pending_questions: string | null;
  overall_feeling: string | null;
  additional_comments: string | null;
  forwarded_to: string[];
  forwarded_at: string | null;
  forwarded_by: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  manager?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface FeedbackFormData {
  overall_rating: number;
  positive_surprise: string;
  integration_level: string;
  has_all_access: boolean;
  missing_access?: string;
  tools_ease_rating: number;
  training_rating: number;
  clarity_level: string;
  difficulties: string;
  complicated_tools?: string;
  onboarding_rating: number;
  what_worked_well: string;
  improvement_suggestions: string;
  pending_questions?: string;
  overall_feeling: string;
  additional_comments?: string;
}

export function useOnboardingFeedbacks(companyId: string | undefined) {
  return useQuery({
    queryKey: ["onboarding-feedbacks", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("onboarding_feedbacks")
        .select(`
          *,
          user:users!onboarding_feedbacks_user_id_fkey(id, full_name, email, avatar_url),
          manager:users!onboarding_feedbacks_manager_id_fkey(id, full_name, email)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OnboardingFeedback[];
    },
    enabled: !!companyId,
  });
}

export function useMyPendingFeedback() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-pending-feedback", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("onboarding_feedbacks")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return data as OnboardingFeedback | null;
    },
    enabled: !!user?.id,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: FeedbackFormData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("onboarding_feedbacks")
        .update({
          ...formData,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pending-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-feedbacks"] });
      toast.success("Feedback enviado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao enviar feedback:", error);
      toast.error("Erro ao enviar feedback");
    },
  });
}

export function useCreateFeedbackForNewHire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      userId,
      managerId,
      hireDate,
    }: {
      companyId: string;
      userId: string;
      managerId?: string;
      hireDate: Date;
    }) => {
      const dueDate = new Date(hireDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const { data, error } = await supabase
        .from("onboarding_feedbacks")
        .insert({
          company_id: companyId,
          user_id: userId,
          manager_id: managerId || null,
          due_date: dueDate.toISOString().split("T")[0],
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-feedbacks"] });
    },
  });
}

export function useForwardFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      forwardToIds,
    }: {
      feedbackId: string;
      forwardToIds: string[];
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("onboarding_feedbacks")
        .update({
          forwarded_to: forwardToIds,
          forwarded_at: new Date().toISOString(),
          forwarded_by: user.id,
        })
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-feedbacks"] });
      toast.success("Feedback encaminhado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao encaminhar feedback:", error);
      toast.error("Erro ao encaminhar feedback");
    },
  });
}
