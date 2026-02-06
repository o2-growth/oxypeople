import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { useCompanyRanking, UserRanking } from "@/hooks/useGamification";
import { useUser } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-amber-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return null;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-amber-500/20 to-amber-500/5 border-amber-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-700/20 to-amber-700/5 border-amber-700/30";
    default:
      return "";
  }
};

function LeaderboardItem({ user, isCurrentUser }: { user: UserRanking; isCurrentUser: boolean }) {
  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        getRankStyle(user.rank),
        isCurrentUser && "ring-2 ring-primary/50"
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-8">
        {getRankIcon(user.rank) || (
          <span className="text-sm font-medium text-muted-foreground">#{user.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {user.full_name || "Usuário"}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              Você
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{user.level.badge_emoji}</span>
          <span style={{ color: user.level.color }}>{user.level.name}</span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <div className="font-bold text-primary">{user.total_points.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">pontos</div>
      </div>
    </div>
  );
}

export function GamificationLeaderboard() {
  const [period, setPeriod] = useState<"month" | "quarter" | "all">("all");
  const { profile } = useUser();
  const { data: ranking, isLoading } = useCompanyRanking(period);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2">
                Mês
              </TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs px-2">
                Trimestre
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">
                Geral
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : ranking && ranking.length > 0 ? (
          <div className="space-y-2">
            {ranking.slice(0, 10).map((user) => (
              <LeaderboardItem
                key={user.user_id}
                user={user}
                isCurrentUser={user.user_id === profile?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum ponto registrado ainda</p>
            <p className="text-sm">Interaja na plataforma para ganhar pontos!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
