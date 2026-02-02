import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { ObjectivesStats as Stats } from "@/hooks/useObjectivesFilters";

interface ObjectivesStatsProps {
  stats: Stats;
  isLoading?: boolean;
}

export function ObjectivesStats({ stats, isLoading }: ObjectivesStatsProps) {
  const statsData = [
    {
      label: "Objetivos",
      value: stats.total,
      icon: Target,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Progresso",
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Encaminhado",
      value: `${stats.onTrackPercentage}%`,
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Em Atenção",
      value: `${stats.atRiskPercentage}%`,
      icon: AlertTriangle,
      iconColor: "text-amber-600",
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
