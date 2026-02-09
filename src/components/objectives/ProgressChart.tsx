import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Checkin } from "@/hooks/useCheckins";

interface ProgressChartProps {
  checkins: Checkin[];
  targetValue: number;
  initialValue: number;
  expectedProgress?: number;
  unit?: string | null;
}

export function ProgressChart({
  checkins,
  targetValue,
  initialValue,
  expectedProgress,
  unit,
}: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (checkins.length === 0) return [];

    const sorted = [...checkins].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const range = targetValue - initialValue;

    return sorted.map((c) => {
      const progress = range > 0
        ? Math.min(100, Math.round(((Number(c.new_value) - initialValue) / range) * 100))
        : 0;

      return {
        date: format(new Date(c.created_at), "dd/MM", { locale: ptBR }),
        fullDate: format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: ptBR }),
        value: Number(c.new_value),
        progress,
        risk: c.perceived_risk,
      };
    });
  }, [checkins, targetValue, initialValue]);

  if (chartData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            Faça check-ins para visualizar a evolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Evolução do Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickFormatter={(v) => `${v}%`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`${value}%`, "Progresso"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullDate || ""
              }
            />
            {/* Expected progress reference line */}
            {expectedProgress != null && expectedProgress > 0 && (
              <ReferenceLine
                y={expectedProgress}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: `Esperado ${Math.round(expectedProgress)}%`,
                  position: "right",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="progress"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
