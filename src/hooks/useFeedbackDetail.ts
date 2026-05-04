import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackDetailRow {
  id: string;
  company_id: string;
  question: string;
  response: string | null;
  competency_tags: string[];
  visibility: "private_requester" | "shared_with_subject" | "shared_with_manager";
  status: "requested" | "answered" | "declined" | "expired";
  due_date: string | null;
  declined_reason: string | null;
  answered_at: string | null;
  created_at: string;
  requester_id: string;
  respondent_id: string;
  subject_user_id: string;
  requester: { id: string; full_name: string | null; avatar_url: string | null } | null;
  respondent: { id: string; full_name: string | null; avatar_url: string | null } | null;
  subject: { id: string; full_name: string | null; avatar_url: string | null } | null;
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

export function useFeedbackDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["feedback-detail", id],
    queryFn: async (): Promise<FeedbackDetailRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("feedback_requests")
        .select(`
          id, company_id, question, response, competency_tags, visibility, status,
          due_date, declined_reason, answered_at, created_at,
          requester_id, respondent_id, subject_user_id,
          requester:users!feedback_requests_requester_id_fkey(id, full_name, avatar_url),
          respondent:users!feedback_requests_respondent_id_fkey(id, full_name, avatar_url),
          subject:users!feedback_requests_subject_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        company_id: data.company_id,
        question: data.question,
        response: data.response,
        competency_tags: tagsToStrings(data.competency_tags),
        visibility: data.visibility as FeedbackDetailRow["visibility"],
        status: data.status as FeedbackDetailRow["status"],
        due_date: data.due_date,
        declined_reason: data.declined_reason,
        answered_at: data.answered_at,
        created_at: data.created_at,
        requester_id: data.requester_id,
        respondent_id: data.respondent_id,
        subject_user_id: data.subject_user_id,
        requester: pickOne(data.requester),
        respondent: pickOne(data.respondent),
        subject: pickOne(data.subject),
      };
    },
    enabled: !!id,
  });
}
