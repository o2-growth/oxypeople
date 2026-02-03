import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { useCreatePost } from "@/hooks/usePosts";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { EmojiPicker } from "./EmojiPicker";
import { ImageUploadButton } from "./ImageUpload";

export function CreatePost() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile } = useUser();
  const createPost = useCreatePost();

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  const handleImageUpload = (urls: string[]) => {
    const remaining = 4 - images.length;
    if (remaining <= 0) {
      toast.error("Máximo de 4 imagens por post");
      return;
    }
    setImages([...images, ...urls.slice(0, remaining)]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;

    try {
      await createPost.mutateAsync({ content, images });
      setContent("");
      setImages([]);
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
              ref={textareaRef}
              placeholder="O que você gostaria de compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-transparent bg-secondary/50 focus:border-primary/30 focus:bg-background"
            />
            
            {/* Preview de imagens anexadas */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, index) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt={`Anexo ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ImageUploadButton 
                  onUpload={handleImageUpload}
                  disabled={images.length >= 4}
                />
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
              <Button 
                disabled={(!content.trim() && images.length === 0) || createPost.isPending} 
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
