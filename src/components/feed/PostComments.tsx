import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useComments, useCreateComment, useDeleteComment, type Comment } from "@/hooks/useComments";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuth();
  const { profile } = useUser();
  const { data: comments, isLoading } = useComments(postId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({ postId, content: newComment });
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Erro ao adicionar comentário");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, postId });
      toast.success("Comentário excluído");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-3 border-t border-border">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-3 border-t border-border">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || createComment.isPending}
          >
            {createComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthor={user?.id === comment.author_id}
              onDelete={() => handleDelete(comment.id)}
              isDeleting={deleteComment.isPending}
            />
          ))}
        </div>
      )}

      {comments && comments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isAuthor: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

function CommentItem({ comment, isAuthor, onDelete, isDeleting }: CommentItemProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(comment.author.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{comment.author.full_name || "Usuário"}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground mt-1">{comment.content}</p>
      </div>
    </div>
  );
}
