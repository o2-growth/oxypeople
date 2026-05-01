import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export interface ObjectiveComment {
  id: string;
  objective_id: string;
  key_result_id: string | null;
  parent_comment_id: string | null;
  author_id: string;
  content: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface UseObjectiveCommentsOptions {
  keyResultId?: string | null;
}

export function useObjectiveComments(
  objectiveId: string | undefined,
  options: UseObjectiveCommentsOptions = {},
) {
  const queryClient = useQueryClient();
  const { keyResultId } = options;

  const queryKey = ["objective-comments", objectiveId, keyResultId ?? null];

  const list = useQuery({
    queryKey,
    queryFn: async (): Promise<ObjectiveComment[]> => {
      if (!objectiveId) return [];

      let query = supabase
        .from("objective_comments")
        .select(`
          id,
          objective_id,
          key_result_id,
          parent_comment_id,
          author_id,
          content,
          edited_at,
          created_at,
          updated_at,
          author:author_id(id, full_name, email, avatar_url)
        `)
        .eq("objective_id", objectiveId)
        .order("created_at", { ascending: true });

      if (keyResultId) {
        query = query.eq("key_result_id", keyResultId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        objective_id: row.objective_id,
        key_result_id: row.key_result_id,
        parent_comment_id: row.parent_comment_id,
        author_id: row.author_id,
        content: row.content,
        edited_at: row.edited_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: row.author as ObjectiveComment["author"],
      }));
    },
    enabled: !!objectiveId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["objective-comments", objectiveId] });
  };

  // Realtime subscription on objective_comments scoped to this objective
  useEffect(() => {
    if (!objectiveId) return;

    const channel = supabase
      .channel(`objective-comments-${objectiveId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "objective_comments",
          filter: `objective_id=eq.${objectiveId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["objective-comments", objectiveId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [objectiveId, queryClient]);

  const createComment = useMutation({
    mutationFn: async (input: {
      content: string;
      authorId: string;
      keyResultId?: string | null;
      parentCommentId?: string | null;
    }) => {
      if (!objectiveId) throw new Error("Missing objectiveId");
      const trimmed = input.content.trim();
      if (trimmed.length < 1 || trimmed.length > 5000) {
        throw new Error("Comentário deve ter entre 1 e 5000 caracteres");
      }
      const { data, error } = await supabase
        .from("objective_comments")
        .insert({
          objective_id: objectiveId,
          key_result_id: input.keyResultId ?? null,
          parent_comment_id: input.parentCommentId ?? null,
          author_id: input.authorId,
          content: trimmed,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Comentário publicado");
      trackEvent("objective_comment_posted", { objective_id: objectiveId });
    },
    onError: (err: Error) => toast.error(`Erro ao publicar: ${err.message}`),
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const trimmed = content.trim();
      if (trimmed.length < 1 || trimmed.length > 5000) {
        throw new Error("Comentário deve ter entre 1 e 5000 caracteres");
      }
      const { error } = await supabase
        .from("objective_comments")
        .update({ content: trimmed, edited_at: new Date().toISOString() })
        .eq("id", commentId);
      if (error) throw error;
      return { commentId };
    },
    onSuccess: () => {
      invalidate();
      toast.success("Comentário atualizado");
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar: ${err.message}`),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("objective_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return commentId;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Comentário removido");
    },
    onError: (err: Error) => toast.error(`Erro ao remover: ${err.message}`),
  });

  return {
    comments: list.data ?? [],
    isLoading: list.isLoading,
    createComment,
    updateComment,
    deleteComment,
  };
}
