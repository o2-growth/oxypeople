import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { OKRStatusCounts } from "@/hooks/useDashboardFullStats";

const STATUS_CONFIG = [
  { key: "on_track", label: "No Caminho", colorClass: "bg-emerald-500" },
  { key: "attention", label: "Atenção", colorClass: "bg-amber-500" },
  { key: "risk", label: "Risco", colorClass: "bg-red-500" },
  { key: "overdue", label: "Atrasado", colorClass: "bg-muted-foreground" },
  { key: "completed", label: "Concluído", colorClass: "bg-blue-500" },
] as const;

export function OKRStatusSummary({ data }: { data: OKRStatusCounts }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Resumo de OKRs</CardTitle>
          </div>
          <Link
            to="/objectives"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver OKRs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          {STATUS_CONFIG.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${s.colorClass}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-sm font-bold">{(data as any)[s.key]}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso médio ({data.total} objetivos)</span>
            <span className="font-medium">{data.avgProgress}%</span>
          </div>
          <Progress value={data.avgProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
