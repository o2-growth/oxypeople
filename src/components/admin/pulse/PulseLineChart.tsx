import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PulseAnalyticsRow } from "@/hooks/usePulseAnalytics";

interface PulseLineChartProps {
  rows: PulseAnalyticsRow[];
  questionType: "scale_1_5" | "enps_0_10" | "mood_emoji";
}

function formatPeriod(value: string) {
  try {
    return format(parseISO(value), "dd/MM", { locale: ptBR });
  } catch {
    return value;
  }
}

export function PulseLineChart({ rows, questionType }: PulseLineChartProps) {
  const useEnps = questionType === "enps_0_10";
  const data = rows.map((r) => ({
    period: formatPeriod(r.period_start),
    rawPeriod: r.period_start,
    value: useEnps ? r.enps?.enps ?? 0 : r.avg,
    count: r.count,
  }));

  const yDomain: [number, number] = useEnps ? [-100, 100] : questionType === "scale_1_5" || questionType === "mood_emoji" ? [1, 5] : [0, 10];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis domain={yDomain} stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, _name, payload) => {
            const count = (payload as unknown as { payload: { count: number } })?.payload?.count;
            return [`${value} (${count} resp.)`, useEnps ? "eNPS" : "Média"];
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
