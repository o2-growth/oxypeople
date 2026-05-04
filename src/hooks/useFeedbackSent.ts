import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedbackSentRow {
  id: string;
  question: string;
  response: string | null;
  competency_tags: string[];
  visibility: "private_requester" | "shared_with_subject" | "shared_with_manager";
  status: "requested" | "answered" | "declined" | "expired";
  due_date: string | null;
  declined_reason: string | null;
  answered_at: string | null;
  created_at: string;
  respondent: { id: string; full_name: string | null; avatar_url: string | null } | null;
  subject: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export type FeedbackSentStatusFilter = "all" | "requested" | "answered" | "declined";

export const FEEDBACK_SENT_KEY = "feedback-sent";

export function useFeedbackSent(status: FeedbackSentStatusFilter = "all") {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [FEEDBACK_SENT_KEY, userId, status],
    queryFn: async (): Promise<FeedbackSentRow[]> => {
      if (!userId) return [];
      let query = supabase
        .from("feedback_requests")
        .select(`
          id, question, response, competency_tags, visibility, status,
          due_date, declined_reason, answered_at, created_at,
          respondent:users!feedback_requests_respondent_id_fkey(id, full_name, avatar_url),
          subject:users!feedback_requests_subject_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });

      if (status !== "all") query = query.eq("status", status);

      const { data, error } = await query;
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
  return arr
    .map((t) => (typeof t === "string" ? t : t?.label ?? ""))
    .filter(Boolean);
}

function mapRows(data: Array<Record<string, unknown>>): FeedbackSentRow[] {
  return data.map((row) => ({
    id: row.id as string,
    question: row.question as string,
    response: (row.response as string | null) ?? null,
    competency_tags: tagsToStrings(row.competency_tags),
    visibility: row.visibility as FeedbackSentRow["visibility"],
    status: row.status as FeedbackSentRow["status"],
    due_date: (row.due_date as string | null) ?? null,
    declined_reason: (row.declined_reason as string | null) ?? null,
    answered_at: (row.answered_at as string | null) ?? null,
    created_at: row.created_at as string,
    respondent: pickOne(row.respondent),
    subject: pickOne(row.subject),
  }));
}
