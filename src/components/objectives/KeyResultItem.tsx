import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

interface KeyResultItemProps {
  keyResult: KeyResult;
}

export function KeyResultItem({ keyResult }: KeyResultItemProps) {
  const progress = Math.min((keyResult.currentValue / keyResult.targetValue) * 100, 100);
  const isComplete = progress >= 100;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="shrink-0 mt-0.5">
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium text-foreground">{keyResult.title}</p>
        
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {keyResult.currentValue} / {keyResult.targetValue} {keyResult.unit}
          </span>
        </div>
      </div>
    </div>
  );
}
