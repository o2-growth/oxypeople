import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "draft" | "scheduled";
  startDate: string;
  endDate: string;
  totalQuestions: number;
  responses: number;
  totalParticipants: number;
  anonymous: boolean;
  hasResponded?: boolean;
}

interface SurveyCardProps {
  survey: Survey;
  onRespond?: () => void;
  onViewResults?: () => void;
}

const statusConfig = {
  active: { label: "Ativa", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  completed: { label: "Encerrada", className: "bg-gray-500/10 text-gray-600 border-gray-500/30" },
  draft: { label: "Rascunho", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  scheduled: { label: "Agendada", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
};

export function SurveyCard({ survey, onRespond, onViewResults }: SurveyCardProps) {
  const status = statusConfig[survey.status];
  const participationRate = Math.round((survey.responses / survey.totalParticipants) * 100);

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              {survey.anonymous && (
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                  Anônima
                </Badge>
              )}
              {survey.hasResponded && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Respondida
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg text-foreground">{survey.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{survey.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{survey.startDate} - {survey.endDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{survey.totalQuestions} perguntas</span>
          </div>
        </div>

        {/* Participation Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Participação</span>
            </div>
            <span className="font-medium text-foreground">
              {survey.responses}/{survey.totalParticipants} ({participationRate}%)
            </span>
          </div>
          <Progress value={participationRate} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        {survey.status === "active" && !survey.hasResponded && (
          <Button onClick={onRespond} className="w-full gap-2">
            Responder Pesquisa
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {(survey.status === "completed" || survey.hasResponded) && (
          <Button onClick={onViewResults} variant="outline" className="w-full gap-2">
            Ver Resultados
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {survey.status === "scheduled" && (
          <Button disabled variant="outline" className="w-full">
            Aguardando início
          </Button>
        )}
        {survey.status === "draft" && (
          <Button variant="secondary" className="w-full">
            Editar Rascunho
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
