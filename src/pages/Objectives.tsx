import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreateObjectiveDialog } from "@/components/objectives/CreateObjectiveDialog";
import { ObjectivesContextBar } from "@/components/objectives/ObjectivesContextBar";
import { ExecutiveSummary } from "@/components/objectives/ExecutiveSummary";
import { ObjectivesExport } from "@/components/objectives/ObjectivesExport";
import { ObjectiveTreeNode } from "@/components/objectives/ObjectiveTreeNode";
import { ObjectiveDetailPanel } from "@/components/objectives/ObjectiveDetailPanel";
import { BreakdownObjectiveDialog } from "@/components/objectives/BreakdownObjectiveDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import { useObjectivesFilters } from "@/hooks/useObjectivesFilters";
import { ObjectiveType, ObjectiveWithDetails } from "@/hooks/useObjectives";

export default function Objectives() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{
    type: ObjectiveType;
    parentId?: string;
  }>({ type: "operational" });

  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithDetails | null>(null);
  const [breakdownObjective, setBreakdownObjective] = useState<ObjectiveWithDetails | null>(null);

  const {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    filteredObjectives,
    filteredTree,
    stats,
    departments,
    responsibleUsers,
    isLoading,
    viewMode,
    setViewMode,
  } = useObjectivesFilters();

  const handleCreateChild = (parentId: string, childType: ObjectiveType) => {
    setCreateDefaults({ type: childType, parentId });
    setIsCreateOpen(true);
  };

  const handleNewObjective = () => {
    setCreateDefaults({ type: "strategic" });
    setIsCreateOpen(true);
  };

  const renderTree = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
                <Skeleton className="h-1.5 w-32" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredTree.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum objetivo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "Nenhum objetivo corresponde aos filtros aplicados."
              : "Comece criando um objetivo estratégico para definir a direção da empresa."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          ) : (
            <Button onClick={handleNewObjective}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Objetivo Estratégico
            </Button>
          )}
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {filteredTree.map((objective) => (
          <ObjectiveTreeNode
            key={objective.id}
            objective={objective}
            onCreateChild={handleCreateChild}
            onSelectObjective={setSelectedObjective}
          />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Gestão de Objetivos
            </h1>
            <p className="text-muted-foreground mt-1">
              OKRs hierárquicos — Estratégico → Tático → Operacional → KRs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ObjectivesExport objectives={filteredObjectives} />
            <Button className="gap-2" onClick={handleNewObjective}>
              <Plus className="h-4 w-4" />
              Novo Objetivo
            </Button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <ExecutiveSummary
          stats={stats}
          objectives={filteredObjectives}
          isLoading={isLoading}
          onFilterAtRisk={() => setFilters((p) => ({ ...p, atRisk: !p.atRisk }))}
          onFilterOverdue={() => setFilters((p) => ({ ...p, checkinOverdue: !p.checkinOverdue }))}
          onFilterNoKR={() => setFilters((p) => ({ ...p, noKR: !p.noKR }))}
        />

        {/* Context Bar (view mode + period + filters) */}
        <ObjectivesContextBar
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          departments={departments}
          responsibleUsers={responsibleUsers}
          viewMode={viewMode}
          setViewMode={setViewMode}
          stats={stats}
        />

        {/* Tree View */}
        {renderTree()}
      </div>

      {/* Create Dialog */}
      <CreateObjectiveDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultType={createDefaults.type}
        defaultParentId={createDefaults.parentId}
      />

      {/* Detail Panel */}
      {selectedObjective && (
        <ObjectiveDetailPanel
          open={!!selectedObjective}
          onOpenChange={(open) => !open && setSelectedObjective(null)}
          objective={selectedObjective}
          onCreateChild={handleCreateChild}
          onBreakdown={setBreakdownObjective}
          onSelectObjective={setSelectedObjective}
        />
      )}

      {/* Breakdown Dialog */}
      {breakdownObjective && (
        <BreakdownObjectiveDialog
          open={!!breakdownObjective}
          onOpenChange={(open) => !open && setBreakdownObjective(null)}
          parentObjective={breakdownObjective}
        />
      )}
    </AppLayout>
  );
}
