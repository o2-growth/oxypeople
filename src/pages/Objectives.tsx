import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ObjectiveCard } from "@/components/objectives/ObjectiveCard";
import { CreateObjectiveDialog } from "@/components/objectives/CreateObjectiveDialog";
import { ObjectivesFilters } from "@/components/objectives/ObjectivesFilters";
import { ObjectivesStats } from "@/components/objectives/ObjectivesStats";
import { DepartmentObjectives } from "@/components/objectives/DepartmentObjectives";
import { ObjectivesExport } from "@/components/objectives/ObjectivesExport";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Target, LayoutGrid, GitBranch } from "lucide-react";
import { useObjectivesFilters } from "@/hooks/useObjectivesFilters";

type ViewMode = "grid" | "department";

export default function Objectives() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("department");

  const {
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    removeFilter,
    setPeriodPreset,
    filteredObjectives,
    groupedByDepartment,
    stats,
    departments,
    responsibleUsers,
    isLoading,
  } = useObjectivesFilters();

  const renderObjectivesList = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredObjectives.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum objetivo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "Nenhum objetivo corresponde aos filtros aplicados."
              : "Clique no botão \"Novo Objetivo\" para criar seu primeiro objetivo."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          ) : (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Objetivo
            </Button>
          )}
        </Card>
      );
    }

    if (viewMode === "department") {
      return <DepartmentObjectives groupedObjectives={groupedByDepartment} />;
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredObjectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
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
              Objetivos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie OKRs e acompanhe o progresso das metas
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as ViewMode)}
              className="border rounded-lg p-1"
            >
              <ToggleGroupItem value="grid" aria-label="Visualização em grid">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="department" aria-label="Visualização por departamento">
                <GitBranch className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Export */}
            <ObjectivesExport objectives={filteredObjectives} />

            {/* New Objective */}
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Objetivo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ObjectivesFilters
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          removeFilter={removeFilter}
          filters={filters}
          departments={departments}
          responsibleUsers={responsibleUsers}
          setPeriodPreset={setPeriodPreset}
        />

        {/* Stats */}
        <ObjectivesStats stats={stats} isLoading={isLoading} />

        {/* Objectives List */}
        {renderObjectivesList()}
      </div>

      {/* Create Dialog */}
      <CreateObjectiveDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </AppLayout>
  );
}
