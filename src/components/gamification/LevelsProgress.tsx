import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { DEFAULT_LEVELS, useUserPoints, getLevelForPoints } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

export function LevelsProgress() {
  const { data: userPoints } = useUserPoints();
  const totalPoints = userPoints?.total || 0;
  const currentLevel = getLevelForPoints(totalPoints);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Níveis e Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEFAULT_LEVELS.map((level, index) => {
            const isCurrentLevel = level.name === currentLevel.name;
            const isCompleted = totalPoints >= level.min_points;
            const isNext = index === DEFAULT_LEVELS.indexOf(currentLevel) + 1;
            
            // Calculate progress within this level
            const nextLevel = DEFAULT_LEVELS[index + 1];
            let progressInLevel = 0;
            
            if (isCurrentLevel && nextLevel) {
              progressInLevel = Math.min(
                100,
                ((totalPoints - level.min_points) / (nextLevel.min_points - level.min_points)) * 100
              );
            } else if (isCompleted) {
              progressInLevel = 100;
            }

            return (
              <div
                key={level.name}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  isCurrentLevel && "border-primary bg-primary/5 shadow-sm",
                  !isCompleted && !isCurrentLevel && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{level.badge_emoji}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        isCurrentLevel && "text-primary"
                      )}
                      style={{ color: isCompleted ? level.color : undefined }}
                    >
                      {level.name}
                    </span>
                    {isCurrentLevel && (
                      <Badge variant="default" className="text-xs">
                        Atual
                      </Badge>
                    )}
                    {isNext && (
                      <Badge variant="outline" className="text-xs">
                        Próximo
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {level.min_points === 0
                      ? "0+"
                      : level.max_points === Infinity
                      ? `${level.min_points.toLocaleString()}+`
                      : `${level.min_points.toLocaleString()} - ${level.max_points.toLocaleString()}`}{" "}
                    pts
                  </span>
                </div>
                <Progress
                  value={progressInLevel}
                  className="h-2"
                  style={
                    {
                      "--progress-background": isCompleted ? level.color : undefined,
                    } as React.CSSProperties
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Como ganhar pontos</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Criar post</span>
              <Badge variant="secondary">+5</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comentar</span>
              <Badge variant="secondary">+2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reagir</span>
              <Badge variant="secondary">+1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Enviar reconhecimento</span>
              <Badge variant="secondary">+10</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Receber reconhecimento</span>
              <Badge variant="secondary">+15</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completar objetivo</span>
              <Badge variant="secondary">+20</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
