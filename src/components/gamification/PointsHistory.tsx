import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Star, MessageSquare, Heart, Trophy, Target, BarChart, LogIn } from "lucide-react";
import { usePointsHistory, ACTION_POINTS } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "post":
      return <MessageSquare className="h-4 w-4" />;
    case "comment":
      return <MessageSquare className="h-4 w-4" />;
    case "reaction":
      return <Heart className="h-4 w-4" />;
    case "recognition_sent":
    case "recognition_received":
      return <Trophy className="h-4 w-4" />;
    case "objective_completed":
      return <Target className="h-4 w-4" />;
    case "key_result_updated":
      return <BarChart className="h-4 w-4" />;
    case "nps_response":
      return <Star className="h-4 w-4" />;
    case "daily_login":
      return <LogIn className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case "post":
      return "bg-blue-500/10 text-blue-500";
    case "comment":
      return "bg-green-500/10 text-green-500";
    case "reaction":
      return "bg-pink-500/10 text-pink-500";
    case "recognition_sent":
      return "bg-purple-500/10 text-purple-500";
    case "recognition_received":
      return "bg-amber-500/10 text-amber-500";
    case "objective_completed":
      return "bg-emerald-500/10 text-emerald-500";
    case "key_result_updated":
      return "bg-cyan-500/10 text-cyan-500";
    case "nps_response":
      return "bg-indigo-500/10 text-indigo-500";
    case "daily_login":
      return "bg-gray-500/10 text-gray-500";
    default:
      return "bg-primary/10 text-primary";
  }
};

export function PointsHistory() {
  const { data: history, isLoading } = usePointsHistory(20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Histórico de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {history.map((point) => (
                <div
                  key={point.id}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${getActionColor(
                      point.action_type
                    )}`}
                  >
                    {getActionIcon(point.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {point.description || ACTION_POINTS[point.action_type]?.description || point.action_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(point.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    +{point.points}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum ponto ainda</p>
            <p className="text-sm">Suas atividades aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
