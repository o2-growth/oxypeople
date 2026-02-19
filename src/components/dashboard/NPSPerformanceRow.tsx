import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock, TrendingUp, Target, MessageSquare } from "lucide-react";
import type { NPSData, PerformanceData } from "@/hooks/useDashboardFullStats";

function NPSGauge({ data }: { data: NPSData }) {
  const scoreColor =
    data.score >= 50 ? "text-emerald-500" : data.score >= 0 ? "text-amber-500" : "text-red-500";
  const total = data.totalResponses || 1;
  const pPct = Math.round((data.promoters / total) * 100);
  const dPct = Math.round((data.detractors / total) * 100);
  const nPct = 100 - pPct - dPct;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">NPS Score</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <span className={`text-4xl font-bold ${scoreColor}`}>{data.score}</span>
          <p className="text-xs text-muted-foreground mt-1">{data.totalResponses} respostas</p>
        </div>
        {data.totalResponses > 0 && (
          <>
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500" style={{ width: `${pPct}%` }} />
              <div className="bg-amber-400" style={{ width: `${nPct}%` }} />
              <div className="bg-red-500" style={{ width: `${dPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Promotores {pPct}%</span>
              <span>Neutros {nPct}%</span>
              <span>Detratores {dPct}%</span>
            </div>
          </>
        )}
        {data.totalResponses === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Sem respostas ainda</p>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceCard({ data }: { data: PerformanceData }) {
  const stats = [
    { label: "Ciclos Ativos", value: data.activeCycles, icon: ClipboardCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pendentes", value: data.pendingEvaluations, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Conclusão", value: `${data.completionRate}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Média", value: data.averageScore.toFixed(1), icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function NPSPerformanceRow({
  nps,
  performance,
}: {
  nps: NPSData;
  performance: PerformanceData;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <NPSGauge data={nps} />
      <PerformanceCard data={performance} />
    </div>
  );
}
