import type { TurnoverData } from "@/hooks/useDashboardFullStats";

export function TurnoverMini({ data }: { data: TurnoverData }) {
  const color =
    data.rate < 10 ? "text-emerald-500" : data.rate < 20 ? "text-amber-500" : "text-red-500";
  const bgColor =
    data.rate < 10 ? "bg-emerald-500/10" : data.rate < 20 ? "bg-amber-500/10" : "bg-red-500/10";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Turnover</h3>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          <span className={`text-lg font-bold ${color}`}>{data.rate}%</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taxa de turnover</p>
          <p className="text-xs text-muted-foreground">
            Tempo médio: <span className="font-medium text-foreground">{data.avgTenureMonths}m</span>
          </p>
        </div>
      </div>
    </div>
  );
}
