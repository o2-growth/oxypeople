import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FeedbackInboxFilter = "pending" | "answered" | "declined" | "all" | "overdue";

export interface FeedbackInboxRow {
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
  requester: { id: string; full_name: string | null; avatar_url: string | null } | null;
  subject: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export const FEEDBACK_INBOX_KEY = "feedback-inbox";

export function useFeedbackInbox(filter: FeedbackInboxFilter = "pending") {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [FEEDBACK_INBOX_KEY, userId, filter],
    queryFn: async (): Promise<FeedbackInboxRow[]> => {
      if (!userId) return [];

      let query = supabase
        .from("feedback_requests")
        .select(`
          id, question, response, competency_tags, visibility, status,
          due_date, declined_reason, answered_at, created_at,
          requester:users!feedback_requests_requester_id_fkey(id, full_name, avatar_url),
          subject:users!feedback_requests_subject_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("respondent_id", userId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (filter === "pending") query = query.eq("status", "requested");
      if (filter === "answered") query = query.eq("status", "answered");
      if (filter === "declined") query = query.eq("status", "declined");
      if (filter === "overdue") {
        const today = new Date().toISOString().slice(0, 10);
        query = query.eq("status", "requested").lt("due_date", today);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const requesterRel = (row.requester as unknown) as
          | { id: string; full_name: string | null; avatar_url: string | null }
          | { id: string; full_name: string | null; avatar_url: string | null }[]
          | null;
        const subjectRel = (row.subject as unknown) as
          | { id: string; full_name: string | null; avatar_url: string | null }
          | { id: string; full_name: string | null; avatar_url: string | null }[]
          | null;
        const tags = (row.competency_tags as unknown as Array<string | { label?: string }>) ?? [];
        return {
          id: row.id,
          question: row.question,
          response: row.response,
          competency_tags: tags
            .map((t) => (typeof t === "string" ? t : t?.label ?? ""))
            .filter(Boolean),
          visibility: row.visibility as FeedbackInboxRow["visibility"],
          status: row.status as FeedbackInboxRow["status"],
          due_date: row.due_date,
          declined_reason: row.declined_reason,
          answered_at: row.answered_at,
          created_at: row.created_at,
          requester: Array.isArray(requesterRel) ? requesterRel[0] ?? null : requesterRel,
          subject: Array.isArray(subjectRel) ? subjectRel[0] ?? null : subjectRel,
        };
      });
    },
    enabled: !!userId,
  });
}
