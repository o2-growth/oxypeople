import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import type { HeadcountData } from "@/hooks/useDashboardFullStats";

export function HeadcountSparkline({ data }: { data: HeadcountData }) {
  const isGrowth = data.growthPercent6m >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Headcount</CardTitle>
          </div>
          <Badge variant={isGrowth ? "default" : "destructive"} className="text-xs gap-1">
            {isGrowth ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isGrowth ? "+" : ""}{data.growthPercent6m}% (6m)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold">{data.current}</span>
          <span className="text-sm text-muted-foreground pb-1">colaboradores</span>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly}>
              <defs>
                <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <RechartsTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, padding: "4px 8px" }}
                formatter={(value: number) => [`${value} pessoas`, "Headcount"]}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="url(#headcountGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
