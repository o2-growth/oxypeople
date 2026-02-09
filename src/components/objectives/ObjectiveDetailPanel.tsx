import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crosshair,
  Layers,
  Zap,
  ChevronRight,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
  Scale,
  GitBranchPlus,
  ListTodo,
} from "lucide-react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";
import { ProgressChart } from "./ProgressChart";
import { AuditHistory } from "./AuditHistory";
import { ObjectiveWithDetails, ObjectiveType } from "@/hooks/useObjectives";
import { useCheckins } from "@/hooks/useCheckins";
import { useActions, useCreateAction, Action, formatWeekLabel } from "@/hooks/useActions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ObjectiveDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: ObjectiveWithDetails;
  allObjectives?: ObjectiveWithDetails[];
  onCreateChild?: (parentId: string, childType: ObjectiveType) => void;
  onBreakdown?: (objective: ObjectiveWithDetails) => void;
  onSelectObjective?: (objective: ObjectiveWithDetails) => void;
}

const typeConfig: Record<ObjectiveType, { label: string; icon: typeof Crosshair; color: string; bgColor: string }> = {
  strategic: { label: "Estratégico", icon: Crosshair, color: "text-violet-400", bgColor: "bg-violet-500/10 border-violet-500/30" },
  tactical: { label: "Tático", icon: Layers, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
  operational: { label: "Operacional", icon: Zap, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
};

const autoStatusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  on_track: { label: "On Track", color: "text-emerald-500", emoji: "✅" },
  attention: { label: "Atenção", color: "text-amber-500", emoji: "⚠️" },
  risk: { label: "Em Risco", color: "text-red-500", emoji: "🔴" },
  overdue: { label: "Atrasado", color: "text-red-600", emoji: "⏰" },
};

function buildBreadcrumb(objective: ObjectiveWithDetails, allObjectives: ObjectiveWithDetails[]): string[] {
  const chain: string[] = [objective.title];
  let current = objective;
  while (current.parent_id) {
    const parent = allObjectives.find((o) => o.id === current.parent_id);
    if (parent) {
      chain.unshift(parent.title);
      current = parent;
    } else break;
  }
  return chain;
}

export function ObjectiveDetailPanel({
  open,
  onOpenChange,
  objective,
  allObjectives = [],
  onCreateChild,
  onBreakdown,
  onSelectObjective,
}: ObjectiveDetailPanelProps) {
  const type = typeConfig[objective.type];
  const TypeIcon = type.icon;
  const autoStatus = autoStatusConfig[(objective as any).auto_status] || null;
  const hasChildren = objective.children && objective.children.length > 0;
  const hasKRs = objective.key_results.length > 0;
  const isOperational = objective.type === "operational";

  const progressColor = objective.progress >= 75
    ? "bg-emerald-500"
    : objective.progress >= 50
    ? "bg-yellow-500"
    : objective.progress >= 25
    ? "bg-orange-500"
    : "bg-red-500";

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

  const childTypeMap: Record<ObjectiveType, ObjectiveType | null> = {
    strategic: "tactical",
    tactical: "operational",
    operational: null,
  };
  const childType = childTypeMap[objective.type];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          {/* Breadcrumb */}
          {allObjectives.length > 0 && objective.parent_id && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
              {buildBreadcrumb(objective, allObjectives).map((title, idx, arr) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-2.5 w-2.5" />}
                  <span className={idx === arr.length - 1 ? "font-medium text-foreground" : ""}>
                    {title.length > 25 ? title.substring(0, 25) + "…" : title}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Type badge */}
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", type.bgColor)}>
              <TypeIcon className={cn("h-4 w-4", type.color)} />
            </div>
            <Badge variant="outline" className={cn("text-xs", type.bgColor)}>
              {type.label}
            </Badge>
            {autoStatus && (
              <Badge variant="outline" className="text-xs">
                {autoStatus.emoji} {autoStatus.label}
              </Badge>
            )}
          </div>

          <SheetTitle className="text-left text-lg">{objective.title}</SheetTitle>

          {objective.description && (
            <p className="text-sm text-muted-foreground">{objective.description}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-bold">{objective.progress}%</span>
            </div>
            <div className="relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", progressColor)} style={{ width: `${Math.min(objective.progress, 100)}%` }} />
              </div>
              {(objective as any).expected_progress > 0 && (
                <div
                  className="absolute top-0 h-2 w-0.5 bg-foreground/40"
                  style={{ left: `${Math.min(Number((objective as any).expected_progress), 100)}%` }}
                  title={`Esperado: ${Math.round(Number((objective as any).expected_progress))}%`}
                />
              )}
            </div>
            {(objective as any).expected_progress > 0 && (
              <p className="text-xs text-muted-foreground">
                Esperado: {Math.round(Number((objective as any).expected_progress))}% • 
                Desvio: {Math.round(Number((objective as any).expected_progress) - objective.progress)}%
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {objective.owner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={objective.owner.avatar_url || ""} />
                  <AvatarFallback className="text-[10px]">
                    {(objective.owner.full_name || objective.owner.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{objective.owner.full_name || objective.owner.email}</p>
                  <p className="text-[10px] text-muted-foreground">Responsável</p>
                </div>
              </div>
            )}
            {objective.due_date && (
              <div>
                <p className="text-xs font-medium">{format(new Date(objective.due_date), "dd MMM yyyy", { locale: ptBR })}</p>
                <p className="text-[10px] text-muted-foreground">
                  Prazo{" "}
                  {(() => {
                    const days = Math.ceil((new Date(objective.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return days > 0 ? `(${days}d restantes)` : days === 0 ? "(hoje)" : `(${Math.abs(days)}d atrasado)`;
                  })()}
                </p>
              </div>
            )}
            {objective.department && (
              <div>
                <p className="text-xs font-medium">{objective.department}</p>
                <p className="text-[10px] text-muted-foreground">Departamento</p>
              </div>
            )}
            {objective.team && (
              <div>
                <p className="text-xs font-medium">{objective.team.name}</p>
                <p className="text-[10px] text-muted-foreground">Equipe</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Content by type */}
          {isOperational ? (
            <OperationalContent
              objective={objective}
              keyResults={keyResults}
              hasKRs={hasKRs}
            />
          ) : (
            <ParentContent
              objective={objective}
              hasChildren={hasChildren}
              childType={childType}
              onCreateChild={onCreateChild}
              onBreakdown={onBreakdown}
              onSelectObjective={onSelectObjective}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Operational objective: shows KRs with tabs for chart & history
function OperationalContent({
  objective,
  keyResults,
  hasKRs,
}: {
  objective: ObjectiveWithDetails;
  keyResults: KeyResult[];
  hasKRs: boolean;
}) {
  // Aggregate all checkins for all KRs to build chart
  const allKrIds = objective.key_results.map((kr) => kr.id);
  // Get checkins for the first KR (primary view) - chart shows aggregate
  const firstKrId = allKrIds[0];
  const { data: checkins = [] } = useCheckins(firstKrId);

  return (
    <div className="space-y-4">
      {/* Impact on parent */}
      {objective.parent_id && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">
                Este objetivo impacta o objetivo pai
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No KR warning */}
      {!hasKRs && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium">Sem Resultados-Chave</p>
              <p className="text-[10px] text-muted-foreground">
                Este objetivo não contribui para o pai sem KRs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: KRs, Ações, Gráfico, Histórico */}
      <Tabs defaultValue="krs" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="krs" className="text-xs">Key Results</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Ações</TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">Gráfico</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="krs" className="mt-3">
          <div>
            <h4 className="text-sm font-medium mb-3">
              Key Results ({keyResults.length})
            </h4>
            {keyResults.length > 0 ? (
              <div className="space-y-2">
                {keyResults.map((kr) => (
                  <KeyResultItem key={kr.id} keyResult={kr} canEdit />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum KR cadastrado.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-3">
          <ObjectiveActionsTab objectiveId={objective.id} />
        </TabsContent>

        <TabsContent value="chart" className="mt-3">
          <ProgressChart
            checkins={checkins}
            targetValue={Number(objective.key_results[0]?.target_value || 100)}
            initialValue={Number((objective.key_results[0] as any)?.initial_value || 0)}
            expectedProgress={Number((objective as any).expected_progress || 0)}
            unit={objective.key_results[0]?.unit}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <AuditHistory entityId={objective.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Strategic/Tactical: shows children, weights
function ParentContent({
  objective,
  hasChildren,
  childType,
  onCreateChild,
  onBreakdown,
  onSelectObjective,
}: {
  objective: ObjectiveWithDetails;
  hasChildren: boolean;
  childType: ObjectiveType | null;
  onCreateChild?: (parentId: string, childType: ObjectiveType) => void;
  onBreakdown?: (objective: ObjectiveWithDetails) => void;
  onSelectObjective?: (objective: ObjectiveWithDetails) => void;
}) {
  const childTypeName = childType ? typeConfig[childType].label : "";

  return (
    <div className="space-y-4">
      {/* Children */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">
            Objetivos Filhos ({objective.children?.length || 0})
          </h4>
          {childType && (
            <div className="flex gap-1.5">
              {onBreakdown && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onBreakdown(objective)}>
                  <GitBranchPlus className="h-3 w-3" />
                  Quebrar
                </Button>
              )}
              {onCreateChild && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onCreateChild(objective.id, childType)}>
                  <Plus className="h-3 w-3" />
                  {childTypeName}
                </Button>
              )}
            </div>
          )}
        </div>

        {hasChildren ? (
          <div className="space-y-2">
            {objective.children!.map((child) => {
              const childAutoStatus = autoStatusConfig[(child as any).auto_status] || null;
              const childProgressColor = child.progress >= 75
                ? "bg-emerald-500"
                : child.progress >= 50
                ? "bg-yellow-500"
                : child.progress >= 25
                ? "bg-orange-500"
                : "bg-red-500";

              return (
                <div
                  key={child.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectObjective?.(child)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{child.title}</span>
                      {childAutoStatus && (
                        <span className={cn("text-xs", childAutoStatus.color)}>
                          {childAutoStatus.emoji}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {child.owner && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={child.owner.avatar_url || ""} />
                          <AvatarFallback className="text-[8px]">
                            {(child.owner.full_name || child.owner.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-xs font-semibold">{child.progress}%</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", childProgressColor)} style={{ width: `${Math.min(child.progress, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Scale className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground mb-3">
              Nenhum objetivo filho criado ainda.
            </p>
            {childType && onBreakdown && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onBreakdown(objective)}>
                <GitBranchPlus className="h-3.5 w-3.5" />
                Quebrar em {childTypeName.toLowerCase()}s
              </Button>
            )}
          </div>
        )}
      </div>

      {/* KR note for parent objectives */}
      <Card className="border-dashed">
        <CardContent className="p-3 flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Progresso calculado automaticamente a partir dos objetivos filhos ponderados.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

// Actions linked to an objective
function ObjectiveActionsTab({ objectiveId }: { objectiveId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const { data: actions = [], isLoading } = useActions();

  const linkedActions = actions.filter((a) => a.objective_id === objectiveId);

  const statusColors: Record<string, string> = {
    todo: "bg-muted text-muted-foreground",
    doing: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    blocked: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  const statusLabels: Record<string, string> = {
    todo: "A Fazer",
    doing: "Fazendo",
    done: "Feito",
    blocked: "Bloqueado",
  };

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando ações...</p>;
  }

  const currentWeek = (() => {
    const d = new Date();
    const dUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dUTC.getUTCDay() || 7;
    dUTC.setUTCDate(dUTC.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dUTC.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((dUTC.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${dUTC.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  })();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Ações ({linkedActions.length})</h4>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3" />
          Nova Ação
        </Button>
      </div>

      {linkedActions.length === 0 ? (
        <div className="text-center py-4">
          <ListTodo className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhuma ação vinculada a este objetivo.
          </p>
        </div>
      ) : (
        linkedActions.map((action) => (
          <div key={action.id} className="p-2.5 rounded-lg border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate flex-1">{action.title}</span>
              <Badge variant="outline" className={cn("text-[10px] ml-2", statusColors[action.status])}>
                {statusLabels[action.status] || action.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {action.owner && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={action.owner.avatar_url || ""} />
                    <AvatarFallback className="text-[7px]">
                      {(action.owner.full_name || action.owner.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{action.owner.full_name || action.owner.email}</span>
                </div>
              )}
              <span>{formatWeekLabel(action.week_bucket)}</span>
            </div>
          </div>
        ))
      )}

      {showCreate && (
        <CreateActionDialogInline
          objectiveId={objectiveId}
          weekBucket={currentWeek}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// Inline create action (simplified for the detail panel)
function CreateActionDialogInline({
  objectiveId,
  weekBucket,
  onClose,
}: {
  objectiveId: string;
  weekBucket: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const createAction = useCreateAction();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!title.trim() || !user?.id) return;
    try {
      await createAction.mutateAsync({
        title: title.trim(),
        objective_id: objectiveId,
        owner_user_id: user.id,
        week_bucket: weekBucket,
        status: "todo",
      });
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
      <input
        className="w-full text-xs bg-transparent border-b border-border focus:border-primary outline-none pb-1"
        placeholder="Título da ação..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-6 text-xs px-2" onClick={handleCreate} disabled={!title.trim() || createAction.isPending}>
          Criar
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
