import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardCheck, ListChecks, BarChart3, Settings2 } from "lucide-react";
import { PerformanceStats } from "@/components/performance/PerformanceStats";
import { CycleCard } from "@/components/performance/CycleCard";
import { CreateCycleDialog } from "@/components/performance/CreateCycleDialog";
import { EvaluationsList } from "@/components/performance/EvaluationsList";
import { MyEvaluations } from "@/components/performance/MyEvaluations";
import { usePerformanceCycles } from "@/hooks/usePerformanceCycles";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Skeleton } from "@/components/ui/skeleton";

export default function Performance() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { cycles, isLoading: cyclesLoading, createCycle, updateCycle, deleteCycle } = usePerformanceCycles();
  const { 
    allEvaluations, 
    pendingEvaluations, 
    completedEvaluations,
    isLoading: evaluationsLoading 
  } = useEvaluations();
  const { isAdmin, isLoading: permissionsLoading } = useUserPermissions();

  const isLoading = cyclesLoading || evaluationsLoading || permissionsLoading;

  const activeCycles = cycles.filter((c) => c.status === "active").length;
  const pendingCount = allEvaluations.filter((e) => e.status === "pending" || e.status === "in_progress").length;
  const completedCount = allEvaluations.filter((e) => e.status === "completed").length;
  const totalEvaluations = allEvaluations.length;
  const completionRate = totalEvaluations > 0 ? Math.round((completedCount / totalEvaluations) * 100) : 0;
  const averageScore = allEvaluations
    .filter((e) => e.overall_score !== null)
    .reduce((acc, e) => acc + (e.overall_score || 0), 0) / (completedCount || 1);

  const handleCreateCycle = (data: Parameters<typeof createCycle.mutate>[0]) => {
    createCycle.mutate(data, {
      onSuccess: () => setCreateDialogOpen(false),
    });
  };

  const handleActivateCycle = (cycleId: string) => {
    updateCycle.mutate({ id: cycleId, status: "active" });
  };

  const handleCompleteCycle = (cycleId: string) => {
    updateCycle.mutate({ id: cycleId, status: "completed" });
  };

  const handleDeleteCycle = (cycleId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este ciclo?")) {
      deleteCycle.mutate(cycleId);
    }
  };

  // Admin View
  if (isAdmin) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Desempenho</h1>
              <p className="text-muted-foreground">
                Gerencie avaliações de desempenho da sua empresa
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ciclo
            </Button>
          </div>

          <Tabs defaultValue="cycles">
            <TabsList>
              <TabsTrigger value="cycles" className="gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Ciclos
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Avaliações
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Resultados
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Automação
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                  <Skeleton className="h-48" />
                </div>
              ) : (
                <>
                  <TabsContent value="cycles" className="space-y-6 mt-0">
                    <PerformanceStats
                      activeCycles={activeCycles}
                      pendingEvaluations={pendingCount}
                      completionRate={completionRate}
                      averageScore={averageScore}
                    />

                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">Ciclos de Avaliação</h2>
                      {cycles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum ciclo de avaliação criado ainda.</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            Criar primeiro ciclo
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {cycles.map((cycle) => {
                            const cycleEvaluations = allEvaluations.filter(
                              (e) => e.cycle_id === cycle.id
                            );
                            const cycleCompleted = cycleEvaluations.filter(
                              (e) => e.status === "completed"
                            ).length;
                            return (
                              <CycleCard
                                key={cycle.id}
                                cycle={cycle}
                                evaluationsCount={cycleEvaluations.length}
                                completedCount={cycleCompleted}
                                onActivate={
                                  cycle.status === "draft"
                                    ? () => handleActivateCycle(cycle.id)
                                    : undefined
                                }
                                onComplete={
                                  cycle.status === "active"
                                    ? () => handleCompleteCycle(cycle.id)
                                    : undefined
                                }
                                onDelete={() => handleDeleteCycle(cycle.id)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="evaluations" className="mt-0">
                    <EvaluationsList
                      evaluations={allEvaluations}
                      cycles={cycles}
                    />
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Resultados e relatórios em breve.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="automation" className="mt-0">
                    <div className="text-center py-12 text-muted-foreground">
                      <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Configurações de automação em breve.</p>
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>

          <CreateCycleDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={handleCreateCycle}
            isLoading={createCycle.isPending}
          />
        </div>
      </AppLayout>
    );
  }

  // User View
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Desempenho</h1>
          <p className="text-muted-foreground">
            Acompanhe suas avaliações de desempenho
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <MyEvaluations
            pendingEvaluations={pendingEvaluations}
            completedEvaluations={completedEvaluations}
          />
        )}
      </div>
    </AppLayout>
  );
}
