import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecognitionCardProps {
  id: string;
  fromUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  toUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  message: string;
  badge: {
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
  } | null;
  points: number;
  createdAt: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RecognitionCard({
  fromUser,
  toUser,
  message,
  badge,
  points,
  createdAt,
}: RecognitionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={fromUser.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(fromUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center text-sm">
              →
            </div>
          </div>

          <Avatar className="h-12 w-12 ring-2 ring-accent/40">
            <AvatarImage src={toUser.avatar_url || ""} />
            <AvatarFallback className="bg-accent/20 text-accent-foreground">
              {getInitials(toUser.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">
                {fromUser.full_name || "Anônimo"}
              </span>
              <span className="text-muted-foreground">reconheceu</span>
              <span className="font-semibold text-foreground">
                {toUser.full_name || "Anônimo"}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{message}</p>

            <div className="mt-4 flex items-center gap-3">
              {badge && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1"
                  style={{
                    backgroundColor: `${badge.color || "#10b981"}20`,
                    color: badge.color || "#10b981",
                  }}
                >
                  <span>{badge.emoji || "🏅"}</span>
                  {badge.name}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-primary">
                +{points} pts
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}
