import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Eye, Play, Award } from "lucide-react";
import { GPTWSurvey, GPTWMetrics } from "@/hooks/useGPTWSurveys";
import { cn } from "@/lib/utils";

interface GPTWSurveyCardProps {
  survey: GPTWSurvey;
  metrics?: GPTWMetrics;
  onRespond?: () => void;
  onViewResults?: () => void;
  showAdminActions?: boolean;
  hasResponded?: boolean;
}

const getStatusBadge = (status: string, endDate: string) => {
  const isExpired = new Date(endDate) < new Date();
  if (status === "completed" || isExpired) {
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Encerrada</Badge>;
  }
  if (status === "active") {
    return <Badge className="bg-success/10 text-success border-success/20">Ativa</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Rascunho</Badge>;
};

export function GPTWSurveyCard({
  survey,
  metrics,
  onRespond,
  onViewResults,
  showAdminActions = false,
  hasResponded = false,
}: GPTWSurveyCardProps) {
  const isActive = survey.status === "active" && new Date(survey.end_date) >= new Date();

  return (
    <Card className={cn("transition-shadow hover:shadow-md", isActive && "border-primary/30")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              Pesquisa GPTW
            </CardTitle>
            <p className="text-sm text-muted-foreground">Trust Index© · 29 afirmativas + eNPS</p>
          </div>
          {getStatusBadge(survey.status, survey.end_date)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin metrics */}
        {showAdminActions && metrics && metrics.totalResponses > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{metrics.overallScore}%</p>
              <p className="text-[10px] text-muted-foreground">Favorabilidade</p>
            </div>
            <div className="text-center">
              <p className={cn("text-xl font-bold", metrics.enpsScore >= 0 ? "text-success" : "text-destructive")}>
                {metrics.enpsScore > 0 ? "+" : ""}{metrics.enpsScore}
              </p>
              <p className="text-[10px] text-muted-foreground">eNPS</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{metrics.totalResponses}</p>
              <p className="text-[10px] text-muted-foreground">Respostas</p>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Encerra em {format(new Date(survey.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          {showAdminActions && metrics && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{metrics.totalResponses} respostas</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {showAdminActions ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewResults}>
              <Eye className="h-4 w-4 mr-1.5" /> Ver Resultados
            </Button>
          ) : isActive && !hasResponded ? (
            <Button size="sm" className="flex-1 bg-gradient-primary" onClick={onRespond}>
              <Play className="h-4 w-4 mr-1.5" /> Responder
            </Button>
          ) : hasResponded ? (
            <Badge variant="outline" className="flex-1 justify-center py-2 bg-success/10 text-success border-success/20">
              ✓ Respondida
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
