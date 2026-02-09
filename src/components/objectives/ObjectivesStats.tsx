import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crosshair, Layers, Zap, TrendingUp } from "lucide-react";
import { ObjectivesStats as Stats } from "@/hooks/useObjectivesFilters";

interface ObjectivesStatsProps {
  stats: Stats;
  isLoading?: boolean;
}

export function ObjectivesStats({ stats, isLoading }: ObjectivesStatsProps) {
  const statsData = [
    {
      label: "Estratégicos",
      value: stats.strategic,
      icon: Crosshair,
      iconColor: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Táticos",
      value: stats.tactical,
      icon: Layers,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Operacionais",
      value: stats.operational,
      icon: Zap,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Progresso Médio",
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
