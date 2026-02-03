import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreatePost } from "@/hooks/usePosts";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export function CreatePost() {
  const [content, setContent] = useState("");
  const { profile } = useUser();
  const createPost = useCreatePost();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync(content);
      setContent("");
      toast.success("Post publicado com sucesso!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erro ao publicar post");
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
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="O que você gostaria de compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-transparent bg-secondary/50 focus:border-primary/30 focus:bg-background"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Botões de mídia e emoji serão implementados em breve */}
              </div>
              <Button 
                disabled={!content.trim() || createPost.isPending} 
                onClick={handleSubmit}
                className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {createPost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
