import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
  MoreVertical,
  Trash2,
  Plus,
  Crosshair,
  Layers,
  Zap,
  GitBranchPlus,
  Users,
} from "lucide-react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";
import { ProgressBarStatus } from "./ProgressBarStatus";
import { StatusBadge } from "./StatusBadge";
import { OverdueBadge } from "./OverdueBadge";
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
  strategic: { label: "Estratégico", icon: Crosshair, color: "text-violet-400", bgColor: "bg-violet-500/10 border-violet-500/30" },
  tactical: { label: "Tático", icon: Layers, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
  operational: { label: "Operacional", icon: Zap, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
};

const childTypeMap: Record<ObjectiveType, ObjectiveType | null> = {
  strategic: "tactical",
  tactical: "operational",
  operational: null,
};

export function ObjectiveTreeNode({ objective, depth = 0, onCreateChild, onSelectObjective }: ObjectiveTreeNodeProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [showKRs, setShowKRs] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { canEditObjective, canDeleteObjective } = useUserPermissions();
  const deleteObjective = useDeleteObjective();

  const isCheckinOverdue = objective.type === "operational" && objective.key_results.length > 0 &&
    objective.key_results.some((kr) => {
      const lastCheckin = (kr as any).last_checkin_at;
      if (!lastCheckin) return true;
      const diff = (Date.now() - new Date(lastCheckin).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7;
    });

  const hasNoKRWarning = objective.type === "operational" && objective.key_results.length === 0;
  const type = typeConfig[objective.type] || typeConfig.operational;
  const TypeIcon = type.icon;
  const hasChildren = objective.children && objective.children.length > 0;
  const hasKRs = objective.key_results.length > 0;
  const canAddChild = childTypeMap[objective.type] !== null;
  const autoStatus = (objective as any).auto_status || "no_data";

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
    kr_type: (kr as any).kr_type,
    direction: (kr as any).direction,
  }));

  return (
    <>
      <div className={cn(
        "group rounded-lg transition-all",
        depth === 0 && "border border-border/60 bg-card shadow-sm",
        depth === 1 && "ml-6 hover:bg-muted/30",
        depth >= 2 && "ml-6 hover:bg-muted/30",
      )}>
        {/* Main row */}
        <div className="flex items-center gap-3 p-3">
          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
              !hasChildren && !hasKRs && "invisible"
            )}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>

          {/* Type icon */}
          <div className={cn("shrink-0 p-1.5 rounded-md", type.bgColor)}>
            <TypeIcon className={cn("h-4 w-4", type.color)} />
          </div>

          {/* Content — clickable */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/objectives/${objective.id}`)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors">
                {objective.title}
              </span>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", type.bgColor)}>
                {type.label}
              </Badge>
              <StatusBadge status={autoStatus} />
              <OverdueBadge overdue={isCheckinOverdue} label="Atrasado" />
              {hasNoKRWarning && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 bg-orange-500/10 text-orange-500 border-orange-500/30">
                  Sem KR
                </Badge>
              )}
            </div>
            {objective.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                {objective.description}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="w-36 shrink-0">
            <ProgressBarStatus
              value={objective.progress}
              expectedValue={Number((objective as any).expected_progress || 0)}
              size="sm"
            />
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

          {/* Children indicator */}
          {hasChildren && (
            <Badge variant="secondary" className="text-[10px] shrink-0 gap-0.5">
              <Users className="h-2.5 w-2.5" />
              {objective.children!.length}
            </Badge>
          )}

          {/* KR count */}
          {hasKRs && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {objective.key_results.length} KR
            </Badge>
          )}

          {/* Due date */}
          {objective.due_date && (
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(objective.due_date), "dd MMM", { locale: ptBR })}
            </span>
          )}

          {/* Menu ⋯ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canAddChild && onCreateChild && (
                <DropdownMenuItem onClick={() => onCreateChild(objective.id, childTypeMap[objective.type]!)}>
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
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expanded: KRs */}
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
                  <KeyResultItem key={kr.id} keyResult={kr} canEdit={canEdit} expandable />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Child weight editor */}
        {isExpanded && hasChildren && (
          <ChildWeightEditor parentId={objective.id} children={objective.children!} canEdit={canEdit} />
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
              Esta ação não pode ser desfeita. O objetivo "{objective.title}" e todos os seus filhos e Key Results serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Breakdown Dialog */}
      {showBreakdown && (
        <BreakdownObjectiveDialog open={showBreakdown} onOpenChange={setShowBreakdown} parentObjective={objective} />
      )}
    </>
  );
}
