import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star, List, Map, Zap, History, Trash2 } from "lucide-react";
import { ObjectivesExport } from "./ObjectivesExport";
import { DisplayMode } from "@/pages/Objectives";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";
import { cn } from "@/lib/utils";

interface BoardHeaderProps {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  onNewObjective: () => void;
  onOpenAudit: () => void;
  onOpenDeleted: () => void;
  filteredObjectives: ObjectiveWithDetails[];
  search: string;
  onSearchChange: (value: string) => void;
}

export function BoardHeader({
  displayMode,
  setDisplayMode,
  onNewObjective,
  onOpenAudit,
  onOpenDeleted,
  filteredObjectives,
  search,
  onSearchChange,
}: BoardHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Gestão de Objetivos</h1>
        <Star className="h-5 w-5 text-muted-foreground hover:text-warning cursor-pointer transition-colors" />
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
          onClick={onOpenAudit}
        >
          <History className="h-3.5 w-3.5" />
          Logs
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
          onClick={onOpenDeleted}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Lixeira
        </Button>
        <ObjectivesExport objectives={filteredObjectives} />
      </div>

      {/* Tabs + toolbar row */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {/* View tabs */}
        <div className="flex items-center gap-0">
          {[
            { key: "tree" as DisplayMode, label: "Tabela", icon: List },
            { key: "map" as DisplayMode, label: "Mapa", icon: Map },
            { key: "actions" as DisplayMode, label: "Ações", icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setDisplayMode(key)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors",
                displayMode === key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Toolbar */}
        <Button onClick={onNewObjective} size="sm" className="gap-1.5 bg-[#00c875] hover:bg-[#00b461] text-white border-0 h-8">
          <Plus className="h-3.5 w-3.5" />
          Novo Item
        </Button>

        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>
    </div>
  );
}
