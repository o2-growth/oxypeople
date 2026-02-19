import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Clock, TrendingUp, Target } from "lucide-react";

interface PerformanceStatsProps {
  activeCycles: number;
  pendingEvaluations: number;
  completionRate: number;
  averageScore: number;
}

export function PerformanceStats({
  activeCycles,
  pendingEvaluations,
  completionRate,
  averageScore,
}: PerformanceStatsProps) {
  const stats = [
    {
      label: "Ciclos Ativos",
      value: activeCycles,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Avaliações Pendentes",
      value: pendingEvaluations,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Taxa de Conclusão",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Média Geral",
      value: averageScore.toFixed(1),
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
