import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useAddPoints } from "@/hooks/useGamification";
import type { Json } from "@/integrations/supabase/types";

export interface Post {
  id: string;
  author_id: string;
  company_id: string;
  content: string;
  visibility: "public" | "company" | "private";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
  reactions_count: number;
  comments_count: number;
  user_has_reacted: boolean;
}

export function usePosts() {
  const { user } = useAuth();
  const { profile } = useUser();

  return useQuery({
    queryKey: ["posts", profile?.primary_company_id],
    queryFn: async (): Promise<Post[]> => {
      if (!profile?.primary_company_id || !user?.id) return [];

      // Fetch posts with author info
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          author:users!posts_author_id_fkey(id, full_name, avatar_url, email)
        `)
        .eq("company_id", profile.primary_company_id)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch reaction counts for all posts
      const postIds = posts?.map((p) => p.id) || [];
      
      const { data: reactions } = await supabase
        .from("reactions")
        .select("post_id")
        .in("post_id", postIds);

      const { data: userReactions } = await supabase
        .from("reactions")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      const { data: comments } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      // Count reactions and comments per post
      const reactionCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      const userReactionSet = new Set(userReactions?.map((r) => r.post_id) || []);

      reactions?.forEach((r) => {
        reactionCounts[r.post_id] = (reactionCounts[r.post_id] || 0) + 1;
      });

      comments?.forEach((c) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });

      return (posts || []).map((post) => ({
        ...post,
        reactions_count: reactionCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        user_has_reacted: userReactionSet.has(post.id),
      })) as Post[];
    },
    enabled: !!profile?.primary_company_id && !!user?.id,
  });
}

export function useCreatePost() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const addPoints = useAddPoints();

  return useMutation({
    mutationFn: async ({ 
      content, 
      images = [], 
      mentions 
    }: { 
      content: string; 
      images?: string[]; 
      mentions?: {
        users?: string[];
        departments?: string[];
        everyone?: boolean;
      };
    }) => {
      if (!user?.id || !profile?.primary_company_id) {
        throw new Error("Not authenticated or no company");
      }

      const metadata: Json = {};
      
      if (images.length > 0) {
        metadata.images = images;
      }
      
      if (mentions && (mentions.users?.length || mentions.departments?.length || mentions.everyone)) {
        metadata.mentions = {
          users: mentions.users || [],
          departments: mentions.departments || [],
          everyone: mentions.everyone || false,
        };
      }

      const hasMetadata = Object.keys(metadata).length > 0;

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          company_id: profile.primary_company_id,
          content,
          visibility: "company" as const,
          metadata: hasMetadata ? metadata : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Add gamification points for creating a post
      addPoints.mutate({ actionType: "post", referenceId: data.id });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useToggleReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addPoints = useAddPoints();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed", postId };
      } else {
        // Add reaction
        const { error } = await supabase
          .from("reactions")
          .insert({
            post_id: postId,
            user_id: user.id,
            type: "like",
          });
        if (error) throw error;
        return { action: "added", postId };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Add gamification points only when adding a reaction
      if (data.action === "added") {
        addPoints.mutate({ actionType: "reaction", referenceId: data.postId });
      }
    },
  });
}
