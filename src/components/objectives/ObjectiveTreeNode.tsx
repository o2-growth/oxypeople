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
  MoreHorizontal,
  Trash2,
  Plus,
  GitBranchPlus,
  Users,
} from "lucide-react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";
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

const typeConfig: Record<ObjectiveType, { label: string; bg: string; borderColor: string }> = {
  strategic: { label: "Estratégico", bg: "bg-[#a25ddc]", borderColor: "border-l-[#a25ddc]" },
  tactical: { label: "Tático", bg: "bg-[#579bfc]", borderColor: "border-l-[#579bfc]" },
  operational: { label: "Operacional", bg: "bg-[#00c875]", borderColor: "border-l-[#00c875]" },
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

  const progress = Math.round(Math.min(Math.max(0, objective.progress), 100));

  const progressColor = progress >= 70 ? "#00c875" : progress >= 40 ? "#fdab3d" : "#e2445c";

  return (
    <>
      <div className={cn(
        depth > 0 && "ml-6",
      )}>
        {/* Main Row — Monday.com style */}
        <div
          className={cn(
            "group flex items-center h-10 hover:bg-accent/60 transition-colors border-b border-border/30",
            depth === 0 && "border-l-4",
            depth === 0 && type.borderColor,
          )}
        >
          {/* Left: Expand + Title */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className={cn(
                "shrink-0 p-0.5 rounded hover:bg-muted transition-colors",
                !hasChildren && !hasKRs && "invisible"
              )}
            >
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>

            <span
              className="text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/objectives/${objective.id}`)}
            >
              {objective.title}
            </span>
          </div>

          {/* Right columns — fixed width Monday cells */}
          <div className="flex items-center shrink-0">
            {/* Type cell — solid colored */}
            <div className="w-[100px] flex items-center justify-center px-1">
              <div className={cn("inline-flex items-center justify-center px-2.5 py-0.5 rounded-sm text-[10px] font-semibold text-white min-w-[75px] text-center", type.bg)}>
                {type.label}
              </div>
            </div>

            {/* Status cell — solid colored */}
            <div className="w-[100px] flex items-center justify-center px-1">
              <StatusBadge status={autoStatus} />
            </div>

            {/* Warning badges */}
            <div className="w-[90px] flex items-center justify-center gap-1 px-1">
              <OverdueBadge overdue={isCheckinOverdue} label="Atrasado" />
              {hasNoKRWarning && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#fdab3d] text-white font-semibold">
                  Sem KR
                </span>
              )}
            </div>

            {/* Progress bar — thicker */}
            <div className="w-[130px] flex items-center gap-2 px-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground w-8 text-right tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Owner avatar */}
            <div className="w-[44px] flex items-center justify-center">
              {objective.owner ? (
                <Avatar className="h-7 w-7 ring-2 ring-background">
                  <AvatarImage src={objective.owner.avatar_url || ""} />
                  <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                    {getInitials(objective.owner.full_name, objective.owner.email)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted" />
              )}
            </div>

            {/* KR / children count */}
            <div className="w-[50px] flex items-center justify-center">
              {hasKRs && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {objective.key_results.length} KR
                </span>
              )}
              {hasChildren && !hasKRs && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="h-3 w-3" />{objective.children!.length}
                </span>
              )}
            </div>

            {/* Due date */}
            <div className="w-[60px] flex items-center justify-center">
              {objective.due_date && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {format(new Date(objective.due_date), "dd MMM", { locale: ptBR })}
                </span>
              )}
            </div>

            {/* Menu — always visible */}
            <div className="w-[36px] flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
          </div>
        </div>

        {/* Expanded: Weight editor */}
        {isExpanded && hasChildren && (
          <ChildWeightEditor parentId={objective.id} children={objective.children!} canEdit={canEdit} />
        )}

        {/* Expanded: KRs toggle */}
        {isExpanded && hasKRs && (
          <div className="px-3 pb-2 pl-10">
            <button
              onClick={() => setShowKRs(!showKRs)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showKRs ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {showKRs ? "Ocultar" : "Ver"} Key Results ({objective.key_results.length})
            </button>
            {showKRs && (
              <div className="space-y-1.5 mt-2">
                {keyResults.map((kr) => (
                  <KeyResultItem key={kr.id} keyResult={kr} canEdit={canEdit} expandable />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="space-y-0">
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
