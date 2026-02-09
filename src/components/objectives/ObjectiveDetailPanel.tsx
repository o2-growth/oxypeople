import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crosshair,
  Layers,
  Zap,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Plus,
  Scale,
  GitBranchPlus,
  ListTodo,
  Calendar,
  Users,
  Target,
  Search,
} from "lucide-react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";
import { ProgressChart } from "./ProgressChart";
import { ProgressBarStatus } from "./ProgressBarStatus";
import { StatusBadge } from "./StatusBadge";
import { OverdueBadge } from "./OverdueBadge";
import { AuditHistory } from "./AuditHistory";
import { ObjectiveWithDetails, ObjectiveType, usePeriods } from "@/hooks/useObjectives";
import { CreateKeyResultDialog } from "./CreateKeyResultDialog";
import { useCheckins } from "@/hooks/useCheckins";
import { useActions, useCreateAction, Action, formatWeekLabel, getWeekBucket } from "@/hooks/useActions";
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

const childTypeMap: Record<ObjectiveType, ObjectiveType | null> = {
  strategic: "tactical",
  tactical: "operational",
  operational: null,
};

function buildBreadcrumb(objective: ObjectiveWithDetails, allObjectives: ObjectiveWithDetails[]): ObjectiveWithDetails[] {
  const chain: ObjectiveWithDetails[] = [objective];
  let current = objective;
  while (current.parent_id) {
    const parent = allObjectives.find((o) => o.id === current.parent_id);
    if (parent) {
      chain.unshift(parent);
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
  const autoStatus = (objective as any).auto_status || "no_data";
  const hasChildren = objective.children && objective.children.length > 0;
  const hasKRs = objective.key_results.length > 0;
  const isOperational = objective.type === "operational";
  const childType = childTypeMap[objective.type];

  const breadcrumb = allObjectives.length > 0 ? buildBreadcrumb(objective, allObjectives) : [objective];

  // Metric cards data
  const daysRemaining = objective.due_date
    ? Math.ceil((new Date(objective.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const metricCards = [
    {
      label: "Responsável",
      value: objective.owner?.full_name || objective.owner?.email || "—",
      icon: Users,
    },
    {
      label: "Período",
      value: objective.due_date
        ? format(new Date(objective.due_date), "dd MMM yyyy", { locale: ptBR })
        : "Sem prazo",
      icon: Calendar,
    },
    {
      label: "Dias Restantes",
      value: daysRemaining != null
        ? daysRemaining > 0 ? `${daysRemaining}d` : daysRemaining === 0 ? "Hoje" : `${Math.abs(daysRemaining)}d atrasado`
        : "—",
      icon: Calendar,
      alert: daysRemaining != null && daysRemaining < 0,
    },
    {
      label: "Key Results",
      value: objective.key_results.length,
      icon: Target,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          {/* Breadcrumb */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
              {breadcrumb.map((item, idx) => (
                <span key={item.id} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-2.5 w-2.5" />}
                  <button
                    className={cn(
                      "hover:text-foreground transition-colors",
                      idx === breadcrumb.length - 1 ? "font-medium text-foreground" : "hover:underline cursor-pointer"
                    )}
                    onClick={() => idx < breadcrumb.length - 1 && onSelectObjective?.(item)}
                  >
                    {item.title.length > 30 ? item.title.substring(0, 30) + "…" : item.title}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Type & Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={cn("p-1.5 rounded-md", type.bgColor)}>
              <TypeIcon className={cn("h-4 w-4", type.color)} />
            </div>
            <Badge variant="outline" className={cn("text-xs", type.bgColor)}>
              {type.label}
            </Badge>
            <StatusBadge status={autoStatus} />
          </div>

          <SheetTitle className="text-left text-lg">{objective.title}</SheetTitle>
          {objective.description && (
            <p className="text-sm text-muted-foreground">{objective.description}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-2xl font-bold">{objective.progress}%</span>
            </div>
            <ProgressBarStatus
              value={objective.progress}
              expectedValue={Number((objective as any).expected_progress || 0)}
              size="lg"
              showValue={false}
            />
            {Number((objective as any).expected_progress) > 0 && (
              <p className="text-xs text-muted-foreground">
                Esperado: {Math.round(Number((objective as any).expected_progress))}% •
                Desvio: {Math.round(Number((objective as any).expected_progress) - objective.progress)}%
              </p>
            )}
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2">
            {metricCards.map((card) => (
              <div key={card.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                <card.icon className={cn("h-3.5 w-3.5 shrink-0", (card as any).alert ? "text-red-500" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-medium truncate", (card as any).alert && "text-red-500")}>
                    {card.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Content by type */}
          {isOperational ? (
            <OperationalContent
              objective={objective}
              hasKRs={hasKRs}
              hasChildren={hasChildren}
              onCreateChild={onCreateChild}
              onBreakdown={onBreakdown}
              childType={childType}
            />
          ) : (
            <ParentContent
              objective={objective}
              hasChildren={hasChildren}
              hasKRs={hasKRs}
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

// === Operational objective: KRs + Actions + Chart + History ===
function OperationalContent({
  objective,
  hasKRs,
  hasChildren,
  onCreateChild,
  onBreakdown,
  childType,
}: {
  objective: ObjectiveWithDetails;
  hasKRs: boolean;
  hasChildren: boolean;
  onCreateChild?: (parentId: string, childType: ObjectiveType) => void;
  onBreakdown?: (objective: ObjectiveWithDetails) => void;
  childType: ObjectiveType | null;
}) {
  const [krSearch, setKrSearch] = useState("");
  const [isCreateKROpen, setIsCreateKROpen] = useState(false);
  const allKrIds = objective.key_results.map((kr) => kr.id);
  const firstKrId = allKrIds[0];
  const { data: checkins = [] } = useCheckins(firstKrId);
  const { data: periods = [] } = usePeriods();
  const period = objective.period_id ? periods.find((p) => p.id === objective.period_id) : null;

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
    owner_user_id: (kr as any).owner_user_id,
    periodStart: period?.start_date,
    periodEnd: period?.end_date,
  }));

  const filteredKRs = krSearch
    ? keyResults.filter((kr) => kr.title.toLowerCase().includes(krSearch.toLowerCase()))
    : keyResults;

  // Empty state: no KRs and no children
  if (!hasKRs && !hasChildren) {
    return (
      <>
        <Card className="border-dashed border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-6 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-orange-500" />
            <div>
              <p className="text-sm font-medium">Este objetivo ainda não possui metas (KRs) nem objetivos filhos.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione Key Results para medir o progresso ou crie objetivos filhos.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setIsCreateKROpen(true)}>
                <Plus className="h-3 w-3" />
                Adicionar KR
              </Button>
              {childType && onCreateChild && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onCreateChild(objective.id, childType)}>
                  <GitBranchPlus className="h-3 w-3" />
                  Criar Objetivo Filho
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <CreateKeyResultDialog
          open={isCreateKROpen}
          onOpenChange={setIsCreateKROpen}
          objectiveId={objective.id}
        />
      </>
    );
  }

  // No KR warning (but has children)
  const showNoKRWarning = !hasKRs && hasChildren;

  return (
    <div className="space-y-4">
      {/* Impact on parent */}
      {objective.parent_id && (
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Este objetivo impacta o objetivo pai
            </span>
          </CardContent>
        </Card>
      )}

      {showNoKRWarning && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium">Sem Resultados-Chave</p>
              <p className="text-[10px] text-muted-foreground">
                Progresso calculado pelos objetivos filhos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="krs" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="krs" className="text-xs">Key Results</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Ações</TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">Gráfico</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="krs" className="mt-3 space-y-3">
          {/* Search */}
          {keyResults.length > 2 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por resultado-chave ou responsável..."
                value={krSearch}
                onChange={(e) => setKrSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          )}

          <h4 className="text-sm font-medium">
            Key Results ({filteredKRs.length})
          </h4>
          {filteredKRs.length > 0 ? (
            <div className="space-y-2">
              {filteredKRs.map((kr) => (
                <KeyResultItem key={kr.id} keyResult={kr} canEdit expandable />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              {krSearch ? "Nenhum KR encontrado para a busca." : "Nenhum KR cadastrado."}
            </p>
          )}
        </TabsContent>

        <TabsContent value="actions" className="mt-3">
          <ObjectiveActionsTab objectiveId={objective.id} />
        </TabsContent>

        <TabsContent value="chart" className="mt-3">
          {hasKRs ? (
            <ProgressChart
              checkins={checkins}
              targetValue={Number(objective.key_results[0]?.target_value || 100)}
              initialValue={Number((objective.key_results[0] as any)?.initial_value || 0)}
              expectedProgress={Number((objective as any).expected_progress || 0)}
              unit={objective.key_results[0]?.unit}
              periodStart={period?.start_date}
              periodEnd={period?.end_date}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Adicione Key Results para visualizar o gráfico de progresso.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <AuditHistory entityId={objective.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === Strategic/Tactical: shows children ===
function ParentContent({
  objective,
  hasChildren,
  hasKRs,
  childType,
  onCreateChild,
  onBreakdown,
  onSelectObjective,
}: {
  objective: ObjectiveWithDetails;
  hasChildren: boolean;
  hasKRs: boolean;
  childType: ObjectiveType | null;
  onCreateChild?: (parentId: string, childType: ObjectiveType) => void;
  onBreakdown?: (objective: ObjectiveWithDetails) => void;
  onSelectObjective?: (objective: ObjectiveWithDetails) => void;
}) {
  const childTypeName = childType ? typeConfig[childType].label : "";

  // Empty state: no children and no KRs
  if (!hasChildren && !hasKRs) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-3">
          <Scale className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Este objetivo ainda não possui metas (KRs) nem objetivos filhos.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quebre em objetivos filhos para desdobrar a estratégia.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {childType && onBreakdown && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onBreakdown(objective)}>
                <GitBranchPlus className="h-3.5 w-3.5" />
                Quebrar em {childTypeName.toLowerCase()}s
              </Button>
            )}
            {childType && onCreateChild && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onCreateChild(objective.id, childType)}>
                <Plus className="h-3 w-3" />
                Criar {childTypeName}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

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

        {hasChildren && (
          <div className="space-y-2">
            {objective.children!.map((child) => {
              const childAutoStatus = (child as any).auto_status || "no_data";
              return (
                <div
                  key={child.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectObjective?.(child)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{child.title}</span>
                      <StatusBadge status={childAutoStatus} showLabel={false} />
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
                  <ProgressBarStatus value={child.progress} showValue={false} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note */}
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

// === Actions linked to an objective ===
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

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando ações...</p>;

  const currentWeek = getWeekBucket(new Date());

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
        <CreateActionInline
          objectiveId={objectiveId}
          weekBucket={currentWeek}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function CreateActionInline({
  objectiveId,
  keyResultId,
  weekBucket,
  onClose,
}: {
  objectiveId: string;
  keyResultId?: string;
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
        key_result_id: keyResultId,
        owner_user_id: user.id,
        week_bucket: weekBucket,
        status: "todo",
      });
      onClose();
    } catch {
      // handled by mutation
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
