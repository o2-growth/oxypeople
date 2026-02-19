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
  const getTimeAgo = () => {
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return "Data inválida";
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };
  
  const timeAgo = getTimeAgo();

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center -space-x-3">
            <Avatar className="h-11 w-11 ring-2 ring-background z-10">
              <AvatarImage src={fromUser.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(fromUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <Avatar className="h-11 w-11 ring-2 ring-background">
              <AvatarImage src={toUser.avatar_url || ""} />
              <AvatarFallback className="bg-accent/20 text-accent-foreground text-sm">
                {getInitials(toUser.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>

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
