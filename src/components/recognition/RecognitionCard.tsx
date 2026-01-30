import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle } from "lucide-react";

interface RecognitionCardProps {
  id: string;
  fromUser: {
    name: string;
    avatar: string;
    initials: string;
  };
  toUser: {
    name: string;
    avatar: string;
    initials: string;
  };
  message: string;
  badge: {
    name: string;
    icon: string;
    color: string;
  };
  points: number;
  createdAt: string;
  likes: number;
  comments: number;
}

export function RecognitionCard({
  fromUser,
  toUser,
  message,
  badge,
  points,
  createdAt,
  likes,
  comments,
}: RecognitionCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={fromUser.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {fromUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center text-sm">
              →
            </div>
          </div>
          
          <Avatar className="h-12 w-12 ring-2 ring-accent/40">
            <AvatarImage src={toUser.avatar} />
            <AvatarFallback className="bg-accent/20 text-accent-foreground">
              {toUser.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{fromUser.name}</span>
              <span className="text-muted-foreground">reconheceu</span>
              <span className="font-semibold text-foreground">{toUser.name}</span>
            </div>
            <p className="mt-2 text-muted-foreground">{message}</p>
            
            <div className="mt-4 flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1"
                style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
              >
                <span>{badge.icon}</span>
                {badge.name}
              </Badge>
              <Badge variant="outline" className="gap-1 text-primary">
                +{points} pts
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">{createdAt}</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{comments}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
