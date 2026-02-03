import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MoreHorizontal, Award, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleReaction, useDeletePost, type Post } from "@/hooks/usePosts";
import { PostComments } from "./PostComments";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const toggleReaction = useToggleReaction();
  const deletePost = useDeletePost();

  const isAuthor = user?.id === post.author_id;
  const metadata = post.metadata as Record<string, unknown> | null;
  const isRecognition = metadata?.type === "recognition";
  const recognitionTo = metadata?.recognition_to as string | undefined;
  const postImages = (metadata?.images as string[]) || [];

  const handleReaction = async () => {
    try {
      await toggleReaction.mutateAsync(post.id);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Erro ao reagir ao post");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post excluído com sucesso");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao excluir post");
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

  return (
    <>
      <Card className="feed-card overflow-hidden">
        {isRecognition && (
          <div className="flex items-center gap-2 bg-gradient-accent px-4 py-2 text-white">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">Reconhecimento</span>
          </div>
        )}
        <CardHeader className="flex flex-row items-start gap-4 pb-2">
          <Avatar className="h-11 w-11 ring-2 ring-border">
            <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.full_name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(post.author.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">{post.author.full_name || post.author.email}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {recognitionTo && (
            <div className="flex items-center gap-2 text-accent font-medium">
              <span>🎉</span>
              <span>Parabéns para {recognitionTo}!</span>
            </div>
          )}
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
          
          {/* Imagens anexadas */}
          {postImages.length > 0 && (
            <div className={cn(
              "grid gap-2",
              postImages.length === 1 && "grid-cols-1",
              postImages.length === 2 && "grid-cols-2",
              postImages.length >= 3 && "grid-cols-2"
            )}>
              {postImages.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "relative overflow-hidden rounded-lg",
                    postImages.length === 1 && "max-h-96",
                    postImages.length >= 3 && index === 0 && "row-span-2"
                  )}
                >
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    style={{ 
                      maxHeight: postImages.length === 1 ? '24rem' : '12rem',
                      minHeight: postImages.length > 1 ? '8rem' : undefined
                    }}
                  />
                </a>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReaction}
                disabled={toggleReaction.isPending}
                className={cn(
                  "gap-2",
                  post.user_has_reacted
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
              >
                {toggleReaction.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={cn("h-4 w-4", post.user_has_reacted && "fill-current")} />
                )}
                <span>{post.reactions_count}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {showComments && <PostComments postId={post.id} />}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
