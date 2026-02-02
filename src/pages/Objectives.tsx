import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ObjectiveCard } from "@/components/objectives/ObjectiveCard";
import { CreateObjectiveDialog } from "@/components/objectives/CreateObjectiveDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Users, Building2, TrendingUp, User } from "lucide-react";
import { useObjectives, useObjectiveStats } from "@/hooks/useObjectives";

export default function Objectives() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: allObjectives,
    isLoading: isLoadingAll,
  } = useObjectives("all");

  const {
    data: personalObjectives,
    isLoading: isLoadingPersonal,
  } = useObjectives("personal");

  const {
    data: teamObjectives,
    isLoading: isLoadingTeam,
  } = useObjectives("team");

  const {
    data: companyObjectives,
    isLoading: isLoadingCompany,
  } = useObjectives("company");

  const { data: stats, isLoading: isLoadingStats } = useObjectiveStats();

  const statsData = [
    {
      label: "Total de Objetivos",
      value: stats?.total || 0,
      icon: Target,
      color: "text-primary",
    },
    {
      label: "No Prazo",
      value: stats?.onTrack || 0,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Em Risco",
      value: stats?.atRisk || 0,
      icon: Target,
      color: "text-yellow-500",
    },
    {
      label: "Atrasados",
      value: stats?.offTrack || 0,
      icon: Target,
      color: "text-red-500",
    },
  ];

  // Calculate overall progress
  const overallProgress =
    allObjectives && allObjectives.length > 0
      ? Math.round(
          allObjectives.reduce((sum, obj) => sum + obj.progress, 0) /
            allObjectives.length
        )
      : 0;

  const renderObjectivesList = (
    objectives: typeof allObjectives,
    isLoading: boolean
  ) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!objectives || objectives.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum objetivo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Clique no botão "Novo Objetivo" para criar seu primeiro objetivo.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Objetivo
          </Button>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {objectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Objetivos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie OKRs e acompanhe o progresso das metas
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Objetivo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) =>
            isLoadingStats ? (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {overallProgress}% concluído
                </span>
                <span className="text-sm text-muted-foreground">
                  {stats?.total || 0} objetivos
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Objectives List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Target className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
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
            {renderObjectivesList(allObjectives, isLoadingAll)}
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            {renderObjectivesList(personalObjectives, isLoadingPersonal)}
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            {renderObjectivesList(teamObjectives, isLoadingTeam)}
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            {renderObjectivesList(companyObjectives, isLoadingCompany)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <CreateObjectiveDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </AppLayout>
  );
}
