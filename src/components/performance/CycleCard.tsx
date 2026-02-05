import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, CheckCircle, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PerformanceCycle, PerformanceCycleStatus, PerformanceCycleType } from "@/hooks/usePerformanceCycles";

interface CycleCardProps {
  cycle: PerformanceCycle;
  evaluationsCount: number;
  completedCount: number;
  onActivate?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig: Record<PerformanceCycleStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  scheduled: { label: "Agendado", variant: "outline" },
  active: { label: "Ativo", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const typeLabels: Record<PerformanceCycleType, string> = {
  full: "Full",
  pocket: "Pocket",
  self: "Autoavaliação",
  "180": "180°",
  "360": "360°",
  leader: "Líder",
  custom: "Personalizado",
};

export function CycleCard({
  cycle,
  evaluationsCount,
  completedCount,
  onActivate,
  onComplete,
  onEdit,
  onDelete,
}: CycleCardProps) {
  const status = statusConfig[cycle.status];
  const progress = evaluationsCount > 0 ? Math.round((completedCount / evaluationsCount) * 100) : 0;

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{cycle.name}</h3>
              <Badge variant="outline" className="text-xs">
                {typeLabels[cycle.type]}
              </Badge>
            </div>
            {cycle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {cycle.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {cycle.status === "draft" && onActivate && (
                  <DropdownMenuItem onClick={onActivate}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Ciclo
                  </DropdownMenuItem>
                )}
                {cycle.status === "active" && onComplete && (
                  <DropdownMenuItem onClick={onComplete}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Ciclo
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {format(new Date(cycle.start_date), "dd/MMM", { locale: ptBR })} -{" "}
            {format(new Date(cycle.end_date), "dd/MMM/yyyy", { locale: ptBR })}
          </span>
          <span>
            {completedCount}/{evaluationsCount} concluídas ({progress}%)
          </span>
        </div>
        {evaluationsCount > 0 && (
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
