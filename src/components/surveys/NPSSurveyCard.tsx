import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  Eye,
  Play,
} from "lucide-react";
import { NPSSurvey, NPSMetrics } from "@/hooks/useNPSSurveys";
import { cn } from "@/lib/utils";

interface NPSSurveyCardProps {
  survey: NPSSurvey;
  metrics?: NPSMetrics;
  responsesCount?: number;
  onViewResults?: () => void;
  onRespond?: () => void;
  showAdminActions?: boolean;
  hasResponded?: boolean;
}

const getStatusBadge = (status: string, endDate: string) => {
  const isExpired = new Date(endDate) < new Date();

  if (status === "completed" || isExpired) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Encerrada
      </Badge>
    );
  }
  if (status === "active") {
    return (
      <Badge className="bg-success/10 text-success border-success/20">
        Ativa
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Rascunho
    </Badge>
  );
};

const getNPSScoreColor = (score: number) => {
  if (score >= 50) return "text-success";
  if (score >= 0) return "text-warning";
  return "text-destructive";
};

export function NPSSurveyCard({
  survey,
  metrics,
  responsesCount = 0,
  onViewResults,
  onRespond,
  showAdminActions = false,
  hasResponded = false,
}: NPSSurveyCardProps) {
  const isActive =
    survey.status === "active" && new Date(survey.end_date) >= new Date();

  return (
    <Card className={cn("transition-shadow hover:shadow-md", isActive && "border-primary/30")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium line-clamp-2">
              Pesquisa e-NPS
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {survey.question}
            </p>
          </div>
          {getStatusBadge(survey.status, survey.end_date)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics for admin view */}
        {showAdminActions && metrics && metrics.totalResponses > 0 && (
          <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <p
                className={cn(
                  "text-xl font-bold",
                  getNPSScoreColor(metrics.npsScore)
                )}
              >
                {metrics.npsScore > 0 ? "+" : ""}
                {metrics.npsScore}
              </p>
              <p className="text-[10px] text-muted-foreground">NPS</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-success">
                {metrics.promoterPercent}%
              </p>
              <p className="text-[10px] text-muted-foreground">Promotores</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-warning">
                {metrics.passivePercent}%
              </p>
              <p className="text-[10px] text-muted-foreground">Neutros</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-destructive">
                {metrics.detractorPercent}%
              </p>
              <p className="text-[10px] text-muted-foreground">Detratores</p>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Encerra em{" "}
              {format(new Date(survey.end_date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
          {showAdminActions && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{responsesCount} respostas</span>
            </div>
          )}
          {survey.require_comment_below !== null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>
                Comentário obrigatório para notas ≤ {survey.require_comment_below}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {showAdminActions ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewResults}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Ver Resultados
            </Button>
          ) : isActive && !hasResponded ? (
            <Button
              size="sm"
              className="flex-1 bg-gradient-primary"
              onClick={onRespond}
            >
              <Play className="h-4 w-4 mr-1.5" />
              Responder
            </Button>
          ) : hasResponded ? (
            <Badge
              variant="outline"
              className="flex-1 justify-center py-2 bg-success/10 text-success border-success/20"
            >
              ✓ Respondida
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
