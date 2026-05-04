import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface CompetencyStatsCardProps {
  feedbacks: Array<{ competency_tags: string[]; answered_at: string | null }>;
}

export function CompetencyStatsCard({ feedbacks }: CompetencyStatsCardProps) {
  const { total, last30, top } = useMemo(() => {
    const counts = new Map<string, number>();
    let totalCount = 0;
    let last30Count = 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const fb of feedbacks) {
      totalCount += 1;
      if (fb.answered_at && new Date(fb.answered_at) >= cutoff) last30Count += 1;
      for (const tag of fb.competency_tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const topArr = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return { total: totalCount, last30: last30Count, top: topArr };
  }, [feedbacks]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
          Resumo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Feedbacks recebidos</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{last30}</p>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Top competências</p>
          {top.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Sem competências marcadas ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {top.map(([tag, count]) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag} · {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
