import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:users!comments_author_id_fkey(id, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      parentCommentId,
    }: {
      postId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
      return { postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
