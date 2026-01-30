import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, MoreHorizontal, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FeedPostProps {
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isRecognition?: boolean;
  recognitionTo?: string;
}

export function FeedPost({
  author,
  content,
  timestamp,
  likes,
  comments,
  isRecognition,
  recognitionTo,
}: FeedPostProps) {
  return (
    <Card className="feed-card overflow-hidden">
      {isRecognition && (
        <div className="flex items-center gap-2 bg-gradient-accent px-4 py-2 text-white">
          <Award className="h-4 w-4" />
          <span className="text-sm font-medium">Reconhecimento</span>
        </div>
      )}
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <Avatar className="h-11 w-11 ring-2 ring-border">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {author.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">{author.name}</h4>
              <p className="text-sm text-muted-foreground">{author.role}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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
        <p className="text-foreground leading-relaxed">{content}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Heart className="h-4 w-4" />
              <span>{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
