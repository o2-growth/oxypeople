import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Crosshair, Layers, Zap, AlertTriangle, Clock } from "lucide-react";
import { ObjectiveWithDetails, ObjectiveType } from "@/hooks/useObjectives";
import { cn } from "@/lib/utils";

interface ObjectiveMapNodeProps {
  objective: ObjectiveWithDetails;
  onSelectObjective?: (objective: ObjectiveWithDetails) => void;
}

const typeConfig: Record<ObjectiveType, { label: string; icon: typeof Crosshair; color: string; bgColor: string; borderColor: string }> = {
  strategic: {
    label: "Estratégico",
    icon: Crosshair,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/40",
  },
  tactical: {
    label: "Tático",
    icon: Layers,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/40",
  },
  operational: {
    label: "Operacional",
    icon: Zap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/40",
  },
  personal: {
    label: "Pessoal",
    icon: Crosshair,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/40",
  },
  team: {
    label: "Time",
    icon: Layers,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/40",
  },
  individual: {
    label: "Individual",
    icon: Crosshair,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/40",
  },
};

const autoStatusColors: Record<string, string> = {
  on_track: "bg-emerald-500",
  attention: "bg-amber-500",
  risk: "bg-red-500",
  overdue: "bg-red-600",
};

function MapCard({ objective, onSelectObjective }: ObjectiveMapNodeProps) {
  const type = typeConfig[objective.type] || typeConfig.operational;
  const TypeIcon = type.icon;
  const autoStatus = (objective as any).auto_status || "on_track";
  const statusDot = autoStatusColors[autoStatus] || "bg-muted-foreground";

  const isCheckinOverdue =
    objective.type === "operational" &&
    objective.key_results.length > 0 &&
    objective.key_results.some((kr) => {
      const lastCheckin = (kr as any).last_checkin_at;
      if (!lastCheckin) return true;
      return (Date.now() - new Date(lastCheckin).getTime()) / 86400000 > 7;
    });

  const hasNoKR = objective.type === "operational" && objective.key_results.length === 0;

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const progressColor =
    objective.progress >= 75
      ? "bg-emerald-500"
      : objective.progress >= 50
      ? "bg-yellow-500"
      : objective.progress >= 25
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div
      className={cn(
        "relative w-56 rounded-lg border-2 bg-card shadow-md cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        type.borderColor
      )}
      onClick={() => onSelectObjective?.(objective)}
    >
      {/* Status dot */}
      <div className={cn("absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-card", statusDot)} />

      {/* Header */}
      <div className={cn("flex items-center gap-1.5 px-3 py-2 rounded-t-md", type.bgColor)}>
        <TypeIcon className={cn("h-3.5 w-3.5 shrink-0", type.color)} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-wide", type.color)}>
          {type.label}
        </span>
        {objective.children && objective.children.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1">
            {objective.children.length} filhos
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2">
        <h4 className="text-xs font-medium text-foreground leading-snug line-clamp-2">
          {objective.title}
        </h4>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", progressColor)}
              style={{ width: `${Math.min(objective.progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{objective.progress}%</span>
        </div>

        {/* Footer: owner + badges */}
        <div className="flex items-center justify-between">
          {objective.owner && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={objective.owner.avatar_url || ""} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {getInitials(objective.owner.full_name, objective.owner.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                {objective.owner.full_name || objective.owner.email}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {isCheckinOverdue && (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            {hasNoKR && (
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            )}
            {objective.key_results.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1">
                {objective.key_results.length} KR
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ObjectiveMapNode({ objective, onSelectObjective }: ObjectiveMapNodeProps) {
  const hasChildren = objective.children && objective.children.length > 0;

  return (
    <div className="flex items-start gap-0">
      {/* This node */}
      <div className="flex flex-col items-center">
        <MapCard objective={objective} onSelectObjective={onSelectObjective} />
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="flex items-center">
          {/* Horizontal connector line */}
          <div className="w-8 h-px bg-border self-center shrink-0" />

          {/* Children column with vertical connector */}
          <div className="relative flex flex-col gap-6">
            {/* Vertical line */}
            {objective.children!.length > 1 && (
              <div
                className="absolute left-0 top-[28px] bottom-[28px] w-px bg-border"
                style={{ transform: "translateX(-1px)" }}
              />
            )}

            {objective.children!.map((child, index) => (
              <div key={child.id} className="flex items-center">
                {/* Branch connector */}
                <div className="w-4 h-px bg-border shrink-0" />
                <ObjectiveMapNode
                  objective={child}
                  onSelectObjective={onSelectObjective}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
