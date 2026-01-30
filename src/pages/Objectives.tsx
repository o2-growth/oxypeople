import { AppLayout } from "@/components/layout/AppLayout";
import { ObjectiveCard, Objective } from "@/components/objectives/ObjectiveCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Users, Building2, TrendingUp } from "lucide-react";

const mockObjectives: Objective[] = [
  {
    id: "1",
    title: "Aumentar a satisfação do cliente",
    description: "Melhorar o NPS em 20 pontos até o final do trimestre",
    progress: 75,
    status: "on-track",
    dueDate: "31 Mar 2024",
    owner: { name: "Ana Silva", avatar: "", initials: "AS" },
    visibility: "team",
    keyResults: [
      { id: "kr1", title: "Reduzir tempo de resposta do suporte", currentValue: 2, targetValue: 4, unit: "horas" },
      { id: "kr2", title: "Implementar chat ao vivo", currentValue: 1, targetValue: 1, unit: "" },
      { id: "kr3", title: "Aumentar taxa de resolução no primeiro contato", currentValue: 78, targetValue: 90, unit: "%" },
    ],
  },
  {
    id: "2",
    title: "Lançar nova versão do produto",
    description: "Entregar MVP com as 5 funcionalidades principais",
    progress: 45,
    status: "at-risk",
    dueDate: "15 Fev 2024",
    owner: { name: "Carlos Santos", avatar: "", initials: "CS" },
    visibility: "company",
    keyResults: [
      { id: "kr4", title: "Completar desenvolvimento do módulo A", currentValue: 80, targetValue: 100, unit: "%" },
      { id: "kr5", title: "Finalizar testes de integração", currentValue: 30, targetValue: 100, unit: "%" },
      { id: "kr6", title: "Documentação técnica", currentValue: 50, targetValue: 100, unit: "%" },
    ],
  },
  {
    id: "3",
    title: "Desenvolver habilidades de liderança",
    description: "Participar de treinamentos e mentorias",
    progress: 60,
    status: "on-track",
    dueDate: "30 Jun 2024",
    owner: { name: "Maria Oliveira", avatar: "", initials: "MO" },
    visibility: "personal",
    keyResults: [
      { id: "kr7", title: "Completar curso de gestão", currentValue: 8, targetValue: 12, unit: "módulos" },
      { id: "kr8", title: "Sessões de mentoria realizadas", currentValue: 4, targetValue: 6, unit: "" },
      { id: "kr9", title: "Feedback 360° recebido", currentValue: 1, targetValue: 2, unit: "" },
    ],
  },
  {
    id: "4",
    title: "Reduzir custos operacionais",
    description: "Otimizar processos para economia de 15%",
    progress: 20,
    status: "off-track",
    dueDate: "28 Fev 2024",
    owner: { name: "João Pereira", avatar: "", initials: "JP" },
    visibility: "company",
    keyResults: [
      { id: "kr10", title: "Automatizar processos manuais", currentValue: 2, targetValue: 8, unit: "" },
      { id: "kr11", title: "Renegociar contratos com fornecedores", currentValue: 1, targetValue: 5, unit: "" },
      { id: "kr12", title: "Economia mensal alcançada", currentValue: 5, targetValue: 15, unit: "%" },
    ],
  },
];

const stats = [
  { label: "Total de Objetivos", value: 12, icon: Target, color: "text-primary" },
  { label: "No Prazo", value: 7, icon: TrendingUp, color: "text-green-500" },
  { label: "Em Risco", value: 3, icon: Target, color: "text-yellow-500" },
  { label: "Atrasados", value: 2, icon: Target, color: "text-red-500" },
];

export default function Objectives() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Objetivos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie OKRs e acompanhe o progresso das metas
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Objetivo
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

        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Progresso Geral do Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">58% concluído</span>
                <span className="text-sm text-muted-foreground">42 dias restantes</span>
              </div>
              <Progress value={58} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Objectives List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Target className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2">
              <Target className="h-4 w-4" />
              Meus
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {mockObjectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {mockObjectives
                .filter((o) => o.visibility === "personal")
                .map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {mockObjectives
                .filter((o) => o.visibility === "team")
                .map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {mockObjectives
                .filter((o) => o.visibility === "company")
                .map((objective) => (
                  <ObjectiveCard key={objective.id} objective={objective} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
