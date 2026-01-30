import { AppLayout } from "@/components/layout/AppLayout";
import { SurveyCard, Survey } from "@/components/surveys/SurveyCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3, FileText, CheckCircle2, Clock } from "lucide-react";

const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Pesquisa de Clima Organizacional Q1 2024",
    description: "Avaliação trimestral do ambiente de trabalho, engajamento e satisfação dos colaboradores.",
    status: "active",
    startDate: "01 Jan",
    endDate: "31 Jan",
    totalQuestions: 25,
    responses: 45,
    totalParticipants: 80,
    anonymous: true,
    hasResponded: false,
  },
  {
    id: "2",
    title: "Feedback sobre Novos Benefícios",
    description: "Queremos saber sua opinião sobre os novos benefícios implementados este mês.",
    status: "active",
    startDate: "15 Jan",
    endDate: "25 Jan",
    totalQuestions: 10,
    responses: 62,
    totalParticipants: 80,
    anonymous: false,
    hasResponded: true,
  },
  {
    id: "3",
    title: "Avaliação de Desempenho 360°",
    description: "Avaliação completa envolvendo autoavaliação, gestor e pares.",
    status: "scheduled",
    startDate: "01 Fev",
    endDate: "28 Fev",
    totalQuestions: 40,
    responses: 0,
    totalParticipants: 80,
    anonymous: false,
  },
  {
    id: "4",
    title: "Pesquisa de Engajamento 2023",
    description: "Pesquisa anual de engajamento e satisfação dos colaboradores.",
    status: "completed",
    startDate: "01 Dez",
    endDate: "20 Dez",
    totalQuestions: 30,
    responses: 75,
    totalParticipants: 80,
    anonymous: true,
  },
  {
    id: "5",
    title: "eNPS - Janeiro 2024",
    description: "Pesquisa rápida de Net Promoter Score dos colaboradores.",
    status: "completed",
    startDate: "02 Jan",
    endDate: "05 Jan",
    totalQuestions: 3,
    responses: 72,
    totalParticipants: 80,
    anonymous: true,
    hasResponded: true,
  },
];

const stats = [
  { label: "Pesquisas Ativas", value: 2, icon: FileText, color: "text-green-500" },
  { label: "Aguardando Resposta", value: 1, icon: Clock, color: "text-yellow-500" },
  { label: "Respondidas", value: 4, icon: CheckCircle2, color: "text-primary" },
  { label: "Taxa Média de Participação", value: "82%", icon: BarChart3, color: "text-blue-500" },
];

export default function Surveys() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Pesquisas</h1>
            <p className="text-muted-foreground mt-1">
              Participe das pesquisas e acompanhe os resultados
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Pesquisa
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results Summary */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resumo dos Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-green-500">+45</p>
                <p className="text-sm text-muted-foreground mt-1">eNPS Score</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">4.2</p>
                <p className="text-sm text-muted-foreground mt-1">Satisfação Média</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-blue-500">78%</p>
                <p className="text-sm text-muted-foreground mt-1">Engajamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Surveys List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Respondidas</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSurveys.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSurveys
                .filter((s) => s.status === "active" && !s.hasResponded)
                .map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSurveys
                .filter((s) => s.hasResponded)
                .map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSurveys
                .filter((s) => s.status === "completed")
                .map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
