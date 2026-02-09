import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  Target,
  Calendar,
  MoreVertical,
  Trash2,
  Plus,
  Crosshair,
  Layers,
  Zap,
  GitBranchPlus,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";
import { BreakdownObjectiveDialog } from "./BreakdownObjectiveDialog";
import { ChildWeightEditor } from "./ChildWeightEditor";
import { ObjectiveWithDetails, useDeleteObjective, ObjectiveType } from "@/hooks/useObjectives";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ObjectiveTreeNodeProps {
  objective: ObjectiveWithDetails;
  depth?: number;
  onCreateChild?: (parentId: string, parentType: ObjectiveType) => void;
  onSelectObjective?: (objective: ObjectiveWithDetails) => void;
}

const typeConfig: Record<ObjectiveType, { label: string; icon: typeof Target; color: string; bgColor: string }> = {
  strategic: {
    label: "Estratégico",
    icon: Crosshair,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/30",
  },
  tactical: {
    label: "Tático",
    icon: Layers,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
  },
  operational: {
    label: "Operacional",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: "Planejado", color: "bg-muted text-muted-foreground" },
  active: { label: "Ativo", color: "bg-green-500/10 text-green-500 border-green-500/30" },
  risk: { label: "Em Risco", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  completed: { label: "Concluído", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  canceled: { label: "Cancelado", color: "bg-red-500/10 text-red-500 border-red-500/30" },
};

const autoStatusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  on_track: { label: "On Track", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", emoji: "✅" },
  attention: { label: "Atenção", color: "bg-amber-500/10 text-amber-500 border-amber-500/30", emoji: "⚠️" },
  risk: { label: "Em Risco", color: "bg-red-500/10 text-red-500 border-red-500/30", emoji: "🔴" },
  overdue: { label: "Atrasado", color: "bg-red-600/10 text-red-600 border-red-600/30", emoji: "⏰" },
};

const childTypeMap: Record<ObjectiveType, ObjectiveType | null> = {
  strategic: "tactical",
  tactical: "operational",
  operational: null,
};

export function ObjectiveTreeNode({ objective, depth = 0, onCreateChild, onSelectObjective }: ObjectiveTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [showKRs, setShowKRs] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { canEditObjective, canDeleteObjective } = useUserPermissions();
  const deleteObjective = useDeleteObjective();

  // Check-in overdue detection
  const isCheckinOverdue = objective.type === "operational" && objective.key_results.length > 0 &&
    objective.key_results.some((kr) => {
      const lastCheckin = (kr as any).last_checkin_at;
      if (!lastCheckin) return true;
      const diff = (Date.now() - new Date(lastCheckin).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7;
    });

  const hasNoKRWarning = objective.type === "operational" && objective.key_results.length === 0;

  const type = typeConfig[objective.type] || typeConfig.operational;
  const status = statusConfig[objective.status] || statusConfig.planned;
  const TypeIcon = type.icon;
  const hasChildren = objective.children && objective.children.length > 0;
  const hasKRs = objective.key_results.length > 0;
  const canAddChild = childTypeMap[objective.type] !== null;

  const canEdit = canEditObjective({
    owner_id: objective.owner_id,
    created_by: objective.created_by,
    team_id: objective.team_id,
  });

  const canDelete = canDeleteObjective({ created_by: objective.created_by });

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const handleDelete = async () => {
    try {
      await deleteObjective.mutateAsync(objective.id);
      toast.success("Objetivo excluído!");
      setShowDeleteDialog(false);
    } catch {
      toast.error("Erro ao excluir objetivo");
    }
  };

  const autoStatus = autoStatusConfig[(objective as any).auto_status] || null;

  const keyResults: KeyResult[] = objective.key_results.map((kr) => ({
    id: kr.id,
    title: kr.title,
    current_value: Number(kr.current_value),
    target_value: Number(kr.target_value),
    initial_value: Number((kr as any).initial_value || 0),
    unit: kr.unit,
    objective_id: objective.id,
    weight_percentage: Number((kr as any).weight_percentage || 0),
    last_checkin_at: (kr as any).last_checkin_at,
  }));

  const progressColor = objective.progress >= 75
    ? "bg-emerald-500"
    : objective.progress >= 50
    ? "bg-yellow-500"
    : objective.progress >= 25
    ? "bg-orange-500"
    : "bg-red-500";

  return (
    <>
      <div
        className={cn(
          "group border rounded-lg transition-all",
          depth === 0 && "border-border/60",
          depth === 1 && "border-border/40 ml-6",
          depth >= 2 && "border-border/30 ml-6",
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-3 p-3">
          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
              !hasChildren && !hasKRs && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Type icon */}
          <div className={cn("shrink-0 p-1.5 rounded-md", type.bgColor)}>
            <TypeIcon className={cn("h-4 w-4", type.color)} />
          </div>

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelectObjective?.(objective)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors">
                {objective.title}
              </span>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", type.bgColor)}>
                {type.label}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", status.color)}>
                {status.label}
              </Badge>
              {autoStatus && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", autoStatus.color)}>
                  {autoStatus.emoji} {autoStatus.label}
                </Badge>
              )}
            </div>
            {objective.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                {objective.description}
              </p>
            )}
          </div>

          {/* Progress with expected curve */}
          <div className="flex items-center gap-2 shrink-0 w-44">
            <div className="flex-1 relative">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${Math.min(objective.progress, 100)}%` }}
                />
              </div>
              {/* Expected progress marker */}
              {(objective as any).expected_progress > 0 && (
                <div
                  className="absolute top-0 h-1.5 w-0.5 bg-foreground/40"
                  style={{ left: `${Math.min(Number((objective as any).expected_progress), 100)}%` }}
                  title={`Esperado: ${Math.round(Number((objective as any).expected_progress))}%`}
                />
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground w-8 text-right">
              {objective.progress}%
            </span>
          </div>

          {/* Owner */}
          {objective.owner && (
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={objective.owner.avatar_url || ""} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(objective.owner.full_name, objective.owner.email)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Due date */}
          {objective.due_date && (
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(objective.due_date), "dd MMM", { locale: ptBR })}
            </span>
          )}

          {/* Alerts */}
          {isCheckinOverdue && (
            <span title="Check-in atrasado">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </span>
          )}
          {hasNoKRWarning && (
            <span title="Sem Key Results">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            </span>
          )}

          {/* KR count */}
          {hasKRs && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {objective.key_results.length} KR
            </Badge>
          )}

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canAddChild && onCreateChild && (
                <DropdownMenuItem
                  onClick={() => onCreateChild(objective.id, childTypeMap[objective.type]!)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar {typeConfig[childTypeMap[objective.type]!]?.label}
                </DropdownMenuItem>
              )}
              {canAddChild && canEdit && (
                <DropdownMenuItem onClick={() => setShowBreakdown(true)}>
                  <GitBranchPlus className="h-4 w-4 mr-2" />
                  Quebrar em filhos
                </DropdownMenuItem>
              )}
              {(canAddChild || canDelete) && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expanded content: KRs */}
        {isExpanded && hasKRs && (
          <div className="px-3 pb-3 pl-12 space-y-2">
            <button
              onClick={() => setShowKRs(!showKRs)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showKRs ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {showKRs ? "Ocultar" : "Ver"} Key Results ({objective.key_results.length})
            </button>
            {showKRs && (
              <div className="space-y-2 mt-2">
                {keyResults.map((kr) => (
                  <KeyResultItem key={kr.id} keyResult={kr} canEdit={canEdit} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Child weight editor */}
        {isExpanded && hasChildren && (
          <ChildWeightEditor
            parentId={objective.id}
            children={objective.children!}
            canEdit={canEdit}
          />
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="pb-2 px-2 space-y-2">
            {objective.children!.map((child) => (
              <ObjectiveTreeNode
                key={child.id}
                objective={child}
                depth={depth + 1}
                onCreateChild={onCreateChild}
                onSelectObjective={onSelectObjective}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O objetivo "{objective.title}" e todos os seus
              filhos e Key Results serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Breakdown Dialog */}
      {showBreakdown && (
        <BreakdownObjectiveDialog
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          parentObjective={objective}
        />
      )}
    </>
  );
}
