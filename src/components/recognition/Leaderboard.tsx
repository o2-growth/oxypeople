import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useTopRecognized } from "@/hooks/useTopRecognized";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPositionIcon(position: number) {
  switch (position) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{position}</span>;
  }
}

function getPositionStyle(position: number) {
  switch (position) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30";
    default:
      return "";
  }
}

export function Leaderboard() {
  const { data: topUsers, isLoading } = useTopRecognized(5);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))
        ) : topUsers && topUsers.length > 0 ? (
          topUsers.map((user, index) => (
            <div
              key={user.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${getPositionStyle(index + 1)}`}
            >
              <div className="flex items-center justify-center w-8">
                {getPositionIcon(index + 1)}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.full_name || "Sem nome"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.recognitions_count} reconhecimento{user.recognitions_count !== 1 ? "s" : ""}
                </p>
              </div>

              <Badge variant="secondary" className="font-bold">
                #{index + 1}
              </Badge>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum reconhecimento este mês</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
