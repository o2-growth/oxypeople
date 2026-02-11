import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreateObjectiveDialog } from "@/components/objectives/CreateObjectiveDialog";
import { ObjectivesContextBar } from "@/components/objectives/ObjectivesContextBar";
import { ExecutiveSummary } from "@/components/objectives/ExecutiveSummary";
import { ObjectivesExport } from "@/components/objectives/ObjectivesExport";
import { ObjectiveTreeNode } from "@/components/objectives/ObjectiveTreeNode";
import { ObjectiveDetailPanel } from "@/components/objectives/ObjectiveDetailPanel";
import { BreakdownObjectiveDialog } from "@/components/objectives/BreakdownObjectiveDialog";
import { ObjectivesMap } from "@/components/objectives/ObjectivesMap";
import { ActionsKanban } from "@/components/actions/ActionsKanban";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, List, Map, Zap, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useObjectivesFilters } from "@/hooks/useObjectivesFilters";
import { ObjectiveType, ObjectiveWithDetails } from "@/hooks/useObjectives";

export type DisplayMode = "tree" | "map" | "actions";

export default function Objectives() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("tree");
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
    tree,
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

    // Group by department if viewMode is "department"
    if (viewMode === "department") {
      const grouped: Record<string, ObjectiveWithDetails[]> = {};
      filteredTree.forEach((obj) => {
        const dept = obj.department || (obj.team as any)?.department || "Sem departamento";
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push(obj);
      });

      return (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dept, objectives]) => (
            <Collapsible key={dept} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{dept}</span>
                <span className="text-xs text-muted-foreground">({objectives.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-1">
                {objectives.map((objective) => (
                  <ObjectiveTreeNode
                    key={objective.id}
                    objective={objective}
                    onCreateChild={handleCreateChild}
                    onSelectObjective={setSelectedObjective}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
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
      <div className="objectives-page-bg space-y-5 -m-6 lg:-m-8 p-6 lg:p-8 min-h-full">
        {/* Hero Header */}
        <div className="hero-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white">
                Gestão de Objetivos
              </h1>
              <p className="text-white/70 mt-2 text-base">
                OKRs hierárquicos — Estratégico → Tático → Operacional → KRs
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Display mode toggle */}
              <div className="flex items-center border border-white/20 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm">
                <Button
                  variant={displayMode === "tree" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none h-9 px-3 gap-1.5",
                    displayMode === "tree" ? "bg-white text-foreground hover:bg-white/90" : "text-white hover:bg-white/20"
                  )}
                  onClick={() => setDisplayMode("tree")}
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
                <Button
                  variant={displayMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none h-9 px-3 gap-1.5",
                    displayMode === "map" ? "bg-white text-foreground hover:bg-white/90" : "text-white hover:bg-white/20"
                  )}
                  onClick={() => setDisplayMode("map")}
                >
                  <Map className="h-4 w-4" />
                  Mapa
                </Button>
                <Button
                  variant={displayMode === "actions" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none h-9 px-3 gap-1.5",
                    displayMode === "actions" ? "bg-white text-foreground hover:bg-white/90" : "text-white hover:bg-white/20"
                  )}
                  onClick={() => setDisplayMode("actions")}
                >
                  <Zap className="h-4 w-4" />
                  Ações
                </Button>
              </div>
              <ObjectivesExport objectives={filteredObjectives} />
              <Button 
                className="gap-2 bg-white text-foreground hover:bg-white/90 shadow-lg"
                onClick={handleNewObjective}
              >
                <Plus className="h-4 w-4" />
                Novo Objetivo
              </Button>
            </div>
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

        {/* Content based on display mode */}
        <div className="bg-card rounded-xl p-4 border border-border/40 shadow-sm">
          {displayMode === "tree" && renderTree()}
          {displayMode === "map" && (
            <ObjectivesMap
              tree={filteredTree}
              isLoading={isLoading}
              onSelectObjective={setSelectedObjective}
            />
          )}
          {displayMode === "actions" && <ActionsKanban />}
        </div>
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
          allObjectives={filteredObjectives}
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
