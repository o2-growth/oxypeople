import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { CheckinDialog } from "./CheckinDialog";
import { cn } from "@/lib/utils";

export interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  initial_value?: number;
  unit: string | null;
  objective_id?: string;
  weight_percentage?: number;
  last_checkin_at?: string | null;
}

interface KeyResultItemProps {
  keyResult: KeyResult;
  canEdit?: boolean;
}

export function KeyResultItem({ keyResult, canEdit = false }: KeyResultItemProps) {
  const [showCheckin, setShowCheckin] = useState(false);

  const initialValue = keyResult.initial_value || 0;
  const range = keyResult.target_value - initialValue;
  const progress = range > 0
    ? Math.min(Math.max(0, ((keyResult.current_value - initialValue) / range) * 100), 100)
    : 0;
  const isComplete = progress >= 100;

  const progressColor = progress >= 75
    ? "text-emerald-500"
    : progress >= 50
    ? "text-yellow-500"
    : progress >= 25
    ? "text-orange-500"
    : "text-red-500";

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
        <div className="shrink-0 mt-0.5">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{keyResult.title}</p>
            {keyResult.weight_percentage != null && keyResult.weight_percentage > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {keyResult.weight_percentage}%
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-1.5 flex-1" />

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {keyResult.current_value} / {keyResult.target_value}{" "}
                {keyResult.unit || ""}
              </span>
              <span className={cn("text-xs font-semibold", progressColor)}>
                ({Math.round(progress)}%)
              </span>
              {canEdit && keyResult.objective_id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs gap-1 ml-1"
                  onClick={() => setShowCheckin(true)}
                >
                  <TrendingUp className="h-3 w-3" />
                  Check-in
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCheckin && keyResult.objective_id && (
        <CheckinDialog
          open={showCheckin}
          onOpenChange={setShowCheckin}
          keyResult={{
            id: keyResult.id,
            title: keyResult.title,
            current_value: keyResult.current_value,
            target_value: keyResult.target_value,
            initial_value: keyResult.initial_value,
            unit: keyResult.unit,
            objective_id: keyResult.objective_id,
          }}
        />
      )}
    </>
  );
}
