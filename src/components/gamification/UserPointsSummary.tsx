import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { useUserPoints, useCompanyRanking, getLevelForPoints, getNextLevel } from "@/hooks/useGamification";
import { useUser } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";

export function UserPointsSummary() {
  const { profile } = useUser();
  const { data: userPoints, isLoading: isLoadingPoints } = useUserPoints();
  const { data: ranking, isLoading: isLoadingRanking } = useCompanyRanking("all");

  const totalPoints = userPoints?.total || 0;
  const currentLevel = getLevelForPoints(totalPoints);
  const nextLevel = getNextLevel(currentLevel);
  
  // Calculate progress to next level
  const progressToNext = nextLevel 
    ? Math.min(100, ((totalPoints - currentLevel.min_points) / (nextLevel.min_points - currentLevel.min_points)) * 100)
    : 100;

  // Find user's rank
  const userRank = ranking?.find(r => r.user_id === profile?.id)?.rank || "-";

  if (isLoadingPoints || isLoadingRanking) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Points */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Pontos
          </CardTitle>
          <Star className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalPoints.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +{userPoints?.history.slice(0, 7).reduce((sum, p) => sum + p.points, 0) || 0} nos últimos 7 dias
          </p>
        </CardContent>
      </Card>

      {/* Current Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nível Atual
          </CardTitle>
          <span className="text-2xl">{currentLevel.badge_emoji}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: currentLevel.color }}>
            {currentLevel.name}
          </div>
          {nextLevel && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalPoints} pts</span>
                <span>{nextLevel.min_points} pts</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Faltam {nextLevel.min_points - totalPoints} pts para {nextLevel.name}
              </p>
            </div>
          )}
          {!nextLevel && (
            <p className="text-xs text-muted-foreground mt-1">
              Você atingiu o nível máximo! 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ranking Position */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Posição no Ranking
          </CardTitle>
          <Trophy className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-500">#{userRank}</span>
            <Badge variant="secondary" className="text-xs">
              de {ranking?.length || 0}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Ranking geral da empresa
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
