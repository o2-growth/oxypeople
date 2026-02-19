import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ListChecks, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { WeeklyActionsData } from "@/hooks/useDashboardFullStats";

const STATUS_ITEMS = [
  { key: "todo", label: "A fazer", color: "bg-muted-foreground" },
  { key: "doing", label: "Fazendo", color: "bg-blue-500" },
  { key: "done", label: "Feito", color: "bg-emerald-500" },
  { key: "blocked", label: "Bloqueado", color: "bg-red-500" },
] as const;

export function WeeklyActionsCard({ data }: { data: WeeklyActionsData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Ações da Semana</CardTitle>
          </div>
          <Link
            to="/objectives"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver Kanban <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-5 flex-wrap">
          {STATUS_ITEMS.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-sm font-bold">{(data as any)[s.key]}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.total} ações</span>
            <span>{data.completionRate}% concluído</span>
          </div>
          <Progress value={data.completionRate} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
