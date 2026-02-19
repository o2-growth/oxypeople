import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { UserGamificationData } from "@/hooks/useDashboardFullStats";

export function UserGamificationMini({ data }: { data: UserGamificationData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Gamificação</h3>
        <Link
          to="/gamification"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Ver <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{data.level.badge_emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{data.level.name}</span>
            <span className="text-xs text-muted-foreground">{data.totalPoints} pts</span>
          </div>
          <Progress value={data.progressToNext} className="h-1.5 mt-1" />
          {data.nextLevel && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Próx: {data.nextLevel.name} ({data.nextLevel.min_points} pts)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
