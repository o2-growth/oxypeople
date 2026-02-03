import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Download,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  useAllNPSResults,
  useNPSSurveyResults,
  NPSMetrics,
  calculateNPSMetrics,
} from "@/hooks/useNPSSurveys";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getNPSScoreColor = (score: number) => {
  if (score >= 50) return "text-success";
  if (score >= 0) return "text-warning";
  return "text-destructive";
};

const getNPSScoreBg = (score: number) => {
  if (score >= 50) return "bg-success/10";
  if (score >= 0) return "bg-warning/10";
  return "bg-destructive/10";
};

export function NPSTab() {
  const { data: surveysWithResults, isLoading } = useAllNPSResults();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const { data: surveyResponses } = useNPSSurveyResults(selectedSurveyId);

  // Calculate overall metrics from all surveys
  const allResponses =
    surveysWithResults?.flatMap((s) => s.responses || []) || [];
  const overallMetrics = calculateNPSMetrics(allResponses);

  const handleExportCSV = () => {
    if (!surveysWithResults) return;

    const headers = [
      "Pesquisa",
      "Data Criação",
      "Data Encerramento",
      "Status",
      "Total Respostas",
      "NPS Score",
      "Promotores %",
      "Neutros %",
      "Detratores %",
    ];

    const rows = surveysWithResults.map((survey) => [
      "Pesquisa e-NPS",
      format(new Date(survey.created_at), "dd/MM/yyyy"),
      format(new Date(survey.end_date), "dd/MM/yyyy"),
      survey.status,
      survey.metrics.totalResponses,
      survey.metrics.npsScore,
      survey.metrics.promoterPercent,
      survey.metrics.passivePercent,
      survey.metrics.detractorPercent,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nps-resultados-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48 mx-auto" />
            <div className="h-4 bg-muted rounded w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!surveysWithResults || surveysWithResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhuma pesquisa NPS</h3>
          <p className="text-muted-foreground">
            Crie sua primeira pesquisa e-NPS na página de Pesquisas para começar
            a coletar feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={cn("border-2", getNPSScoreBg(overallMetrics.npsScore))}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NPS Score Geral</p>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    getNPSScoreColor(overallMetrics.npsScore)
                  )}
                >
                  {overallMetrics.npsScore > 0 ? "+" : ""}
                  {overallMetrics.npsScore}
                </p>
              </div>
              {overallMetrics.npsScore >= 0 ? (
                <TrendingUp className="h-8 w-8 text-success" />
              ) : (
                <TrendingDown className="h-8 w-8 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promotores</p>
                <p className="text-3xl font-bold text-success">
                  {overallMetrics.promoterPercent}%
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallMetrics.promoters} pessoas (notas 9-10)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Neutros</p>
                <p className="text-3xl font-bold text-warning">
                  {overallMetrics.passivePercent}%
                </p>
              </div>
              <Minus className="h-8 w-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallMetrics.passives} pessoas (notas 7-8)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Detratores</p>
                <p className="text-3xl font-bold text-destructive">
                  {overallMetrics.detractorPercent}%
                </p>
              </div>
              <ThumbsDown className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallMetrics.detractors} pessoas (notas 0-6)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Survey History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Histórico de Pesquisas</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Pesquisa</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>NPS Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveysWithResults.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">Pesquisa e-NPS</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {survey.question}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(survey.created_at), "dd/MM/yyyy")} -{" "}
                        {format(new Date(survey.end_date), "dd/MM/yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{survey.metrics.totalResponses}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold",
                          getNPSScoreColor(survey.metrics.npsScore)
                        )}
                      >
                        {survey.metrics.npsScore > 0 ? "+" : ""}
                        {survey.metrics.npsScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      {survey.status === "completed" ||
                      new Date(survey.end_date) < new Date() ? (
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground"
                        >
                          Encerrada
                        </Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-success/20">
                          Ativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSurveyId(survey.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Survey Details Dialog */}
      <Dialog
        open={!!selectedSurveyId}
        onOpenChange={() => setSelectedSurveyId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas da Pesquisa</DialogTitle>
          </DialogHeader>

          {surveyResponses && surveyResponses.length > 0 ? (
            <div className="space-y-4">
              {surveyResponses.map((response: any) => (
                <div
                  key={response.id}
                  className="p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={response.user?.avatar_url}
                          alt={response.user?.full_name}
                        />
                        <AvatarFallback>
                          {response.user?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {response.user?.full_name || "Anônimo"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(response.created_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        response.score >= 9 &&
                          "bg-success/10 text-success border-success/20",
                        response.score >= 7 &&
                          response.score <= 8 &&
                          "bg-warning/10 text-warning border-warning/20",
                        response.score <= 6 &&
                          "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      Nota: {response.score}
                    </Badge>
                  </div>
                  {response.comment && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      "{response.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma resposta ainda.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
