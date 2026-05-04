import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedbackAboutMeRow {
  id: string;
  question: string;
  response: string | null;
  competency_tags: string[];
  visibility: "shared_with_subject" | "shared_with_manager";
  status: "requested" | "answered" | "declined" | "expired";
  answered_at: string | null;
  created_at: string;
  requester: { id: string; full_name: string | null; avatar_url: string | null } | null;
  respondent: { id: string; full_name: string | null; avatar_url: string | null } | null;
  subject: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export const FEEDBACK_ABOUT_ME_KEY = "feedback-about-me";

export function useFeedbackAboutMe() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [FEEDBACK_ABOUT_ME_KEY, userId],
    queryFn: async (): Promise<FeedbackAboutMeRow[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("feedback_requests")
        .select(`
          id, question, response, competency_tags, visibility, status,
          answered_at, created_at,
          requester:users!feedback_requests_requester_id_fkey(id, full_name, avatar_url),
          respondent:users!feedback_requests_respondent_id_fkey(id, full_name, avatar_url),
          subject:users!feedback_requests_subject_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("subject_user_id", userId)
        .eq("status", "answered")
        .in("visibility", ["shared_with_subject", "shared_with_manager"])
        .order("answered_at", { ascending: false });

      if (error) throw error;
      return mapRows(data ?? []);
    },
    enabled: !!userId,
  });
}

type RawRel = { id: string; full_name: string | null; avatar_url: string | null };
function pickOne(rel: unknown): RawRel | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return (rel[0] as RawRel) ?? null;
  return rel as RawRel;
}
function tagsToStrings(raw: unknown): string[] {
  const arr = (raw as Array<string | { label?: string }> | null) ?? [];
  return arr.map((t) => (typeof t === "string" ? t : t?.label ?? "")).filter(Boolean);
}

function mapRows(data: Array<Record<string, unknown>>): FeedbackAboutMeRow[] {
  return data.map((row) => ({
    id: row.id as string,
    question: row.question as string,
    response: (row.response as string | null) ?? null,
    competency_tags: tagsToStrings(row.competency_tags),
    visibility: row.visibility as FeedbackAboutMeRow["visibility"],
    status: row.status as FeedbackAboutMeRow["status"],
    answered_at: (row.answered_at as string | null) ?? null,
    created_at: row.created_at as string,
    requester: pickOne(row.requester),
    respondent: pickOne(row.respondent),
    subject: pickOne(row.subject),
  }));
}

export function useFeedbackForTeam() {
  // Manager view: feedbacks shared_with_manager onde subject_user_id está na minha subtree.
  // RLS já restringe via is_user_manager — basta pedir tudo onde visibility=shared_with_manager
  // E NÃO subject_user_id=auth.uid() (esses já aparecem em about-me principal).
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["feedback-for-team", userId],
    queryFn: async (): Promise<FeedbackAboutMeRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("feedback_requests")
        .select(`
          id, question, response, competency_tags, visibility, status,
          answered_at, created_at,
          requester:users!feedback_requests_requester_id_fkey(id, full_name, avatar_url),
          respondent:users!feedback_requests_respondent_id_fkey(id, full_name, avatar_url),
          subject:users!feedback_requests_subject_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("status", "answered")
        .eq("visibility", "shared_with_manager")
        .neq("subject_user_id", userId)
        .order("answered_at", { ascending: false });

      if (error) throw error;
      return mapRows(data ?? []);
    },
    enabled: !!userId,
  });
}
