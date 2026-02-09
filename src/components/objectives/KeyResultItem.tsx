import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  BarChart3,
} from "lucide-react";
import { CheckinDialog } from "./CheckinDialog";
import { ProgressBarStatus } from "./ProgressBarStatus";
import { OverdueBadge } from "./OverdueBadge";
import { ProgressChart } from "./ProgressChart";
import { useCheckins } from "@/hooks/useCheckins";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  initial_value?: number;
  unit: string | null;
  objective_id?: string;
  weight_percentage?: number;
  last_checkin_at?: string | null;
  kr_type?: string;
  direction?: string;
  owner_user_id?: string | null;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
}

interface KeyResultItemProps {
  keyResult: KeyResult;
  canEdit?: boolean;
  expandable?: boolean;
}

const riskConfig: Record<string, { color: string }> = {
  green: { color: "bg-emerald-500" },
  yellow: { color: "bg-yellow-500" },
  red: { color: "bg-red-500" },
};

export function KeyResultItem({ keyResult, canEdit = false, expandable = true }: KeyResultItemProps) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initialValue = keyResult.initial_value || 0;
  const range = keyResult.target_value - initialValue;
  const progress = range > 0
    ? Math.min(Math.max(0, ((keyResult.current_value - initialValue) / range) * 100), 100)
    : 0;
  const isComplete = progress >= 100;

  const isOverdue = (() => {
    if (!keyResult.last_checkin_at) return true;
    const diff = (Date.now() - new Date(keyResult.last_checkin_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  })();

  return (
    <>
      <div className="rounded-lg border bg-card/50 overflow-hidden">
        {/* KR Row */}
        <div className="flex items-center gap-3 p-3">
          {/* Expand toggle */}
          {expandable && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}

          {/* Status icon */}
          <div className="shrink-0">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{keyResult.title}</span>
              {keyResult.weight_percentage != null && keyResult.weight_percentage > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {keyResult.weight_percentage}%
                </Badge>
              )}
              <OverdueBadge overdue={isOverdue && !isComplete} label="Atrasado" />
            </div>
          </div>

          {/* Progress */}
          <div className="w-28 shrink-0">
            <ProgressBarStatus value={progress} showValue={false} size="sm" />
          </div>

          {/* Value */}
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {keyResult.current_value} / {keyResult.target_value} {keyResult.unit || ""}
          </span>

          <span className={cn(
            "text-xs font-semibold shrink-0",
            progress >= 75 ? "text-emerald-500" : progress >= 50 ? "text-yellow-500" : progress >= 25 ? "text-orange-500" : "text-red-500"
          )}>
            {Math.round(progress)}%
          </span>

          {/* Owner avatar */}
          {keyResult.owner && (
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={keyResult.owner.avatar_url || ""} />
              <AvatarFallback className="text-[8px]">
                {(keyResult.owner.full_name || keyResult.owner.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Check-in CTA */}
          {canEdit && keyResult.objective_id && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs gap-1 shrink-0"
              onClick={() => setShowCheckin(true)}
            >
              <TrendingUp className="h-3 w-3" />
              Check-in
            </Button>
          )}
        </div>

        {/* Expanded: Tabs */}
        {expanded && expandable && (
          <KeyResultDetailPanel krId={keyResult.id} kr={keyResult} />
        )}
      </div>

      {showCheckin && keyResult.objective_id && (
        <CheckinDialog
          open={showCheckin}
          onOpenChange={setShowCheckin}
          keyResult={{
            id: keyResult.id,
            title: keyResult.title,
            current_value: keyResult.current_value,
            target_value: keyResult.target_value,
            initial_value: keyResult.initial_value,
            unit: keyResult.unit,
            objective_id: keyResult.objective_id,
          }}
        />
      )}
    </>
  );
}

function KeyResultDetailPanel({ krId, kr }: { krId: string; kr: KeyResult }) {
  const { data: checkins = [], isLoading } = useCheckins(krId);

  const supportsChart = kr.kr_type !== "binary";

  return (
    <div className="px-3 pb-3 border-t">
      <Tabs defaultValue="checkins" className="w-full mt-2">
        <TabsList className="w-full grid grid-cols-2 h-7">
          <TabsTrigger value="checkins" className="text-xs">Check-ins</TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs">Acompanhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : checkins.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-xs text-muted-foreground">
                Nenhum check-in registrado ainda.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="space-y-1.5">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="p-2 rounded-lg bg-muted/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {checkin.user && (
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={checkin.user.avatar_url || ""} />
                            <AvatarFallback className="text-[7px]">
                              {(checkin.user.full_name || checkin.user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-[11px] font-medium">
                          {checkin.previous_value} → {Number(checkin.new_value)}
                        </span>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          riskConfig[checkin.perceived_risk]?.color || "bg-muted"
                        )} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(checkin.created_at), "dd MMM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{checkin.comment}</p>
                    {checkin.has_blocker && (
                      <Badge variant="destructive" className="text-[9px]">
                        🚫 {checkin.blocker_description || "Bloqueio"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="mt-2">
          {supportsChart ? (
            <ProgressChart
              checkins={checkins}
              targetValue={kr.target_value}
              initialValue={kr.initial_value || 0}
              unit={kr.unit}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Tipo de meta não possui acompanhamento em gráfico.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
