import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Target,
  Crosshair,
  Layers,
  Zap,
  TrendingUp,
} from "lucide-react";
import { ObjectivesStats } from "@/hooks/useObjectivesFilters";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";
import { cn } from "@/lib/utils";

interface ExecutiveSummaryProps {
  stats: ObjectivesStats;
  objectives: ObjectiveWithDetails[];
  isLoading: boolean;
  onFilterAtRisk: () => void;
  onFilterOverdue: () => void;
  onFilterNoKR: () => void;
}

export function ExecutiveSummary({
  stats,
  objectives,
  isLoading,
  onFilterAtRisk,
  onFilterOverdue,
  onFilterNoKR,
}: ExecutiveSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Top desvios: objectives with largest gap between expected and actual
  const topDeviations = objectives
    .filter((o) => (o as any).expected_progress > 0)
    .map((o) => ({
      ...o,
      deviation: Number((o as any).expected_progress) - o.progress,
    }))
    .filter((o) => o.deviation > 0)
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 3);

  const cards = [
    {
      label: "Em Risco",
      value: stats.atRiskCount,
      icon: AlertTriangle,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: stats.atRiskCount > 0 ? "border-red-500/30" : "",
      onClick: onFilterAtRisk,
    },
    {
      label: "Check-in Atrasado",
      value: stats.overdueCheckinCount,
      icon: Clock,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: stats.overdueCheckinCount > 0 ? "border-amber-500/30" : "",
      onClick: onFilterOverdue,
    },
    {
      label: "Sem KR",
      value: stats.noKRCount,
      icon: Target,
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: stats.noKRCount > 0 ? "border-orange-500/30" : "",
      onClick: onFilterNoKR,
    },
    {
      label: "Progresso Médio",
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      iconColor: stats.averageProgress >= 50 ? "text-emerald-400" : "text-amber-400",
      bgColor: stats.averageProgress >= 50 ? "bg-emerald-500/10" : "bg-amber-500/10",
      borderColor: "",
      onClick: undefined,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Main stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className={cn(
              "transition-colors",
              card.borderColor,
              card.onClick && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={card.onClick}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("p-2.5 rounded-lg", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top deviations */}
      {topDeviations.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-muted-foreground">Top desvios da semana</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topDeviations.map((obj) => (
                <Badge
                  key={obj.id}
                  variant="outline"
                  className="text-xs gap-1.5 py-1 border-red-500/30"
                >
                  <span className="truncate max-w-[150px]">{obj.title}</span>
                  <span className="text-red-400 font-semibold">-{Math.round(obj.deviation)}%</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type breakdown row */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Estratégicos", value: stats.strategic, icon: Crosshair, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Táticos", value: stats.tactical, icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Operacionais", value: stats.operational, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-2 p-3">
              <div className={cn("p-1.5 rounded", s.bg)}>
                <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
