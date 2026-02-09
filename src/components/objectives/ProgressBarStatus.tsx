import { cn } from "@/lib/utils";

interface ProgressBarStatusProps {
  value: number;
  expectedValue?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getProgressColor(value: number): string {
  if (value >= 75) return "bg-emerald-500";
  if (value >= 50) return "bg-yellow-500";
  if (value >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function ProgressBarStatus({
  value,
  expectedValue,
  showValue = true,
  size = "sm",
  className,
}: ProgressBarStatusProps) {
  const clamped = Math.min(Math.max(0, value), 100);
  const heightClass = size === "lg" ? "h-2.5" : size === "md" ? "h-2" : "h-1.5";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 relative">
        <div className={cn("bg-muted rounded-full overflow-hidden", heightClass)}>
          <div
            className={cn("h-full rounded-full transition-all", getProgressColor(clamped))}
            style={{ width: `${clamped}%` }}
          />
        </div>
        {expectedValue != null && expectedValue > 0 && (
          <div
            className={cn("absolute top-0 w-0.5 bg-foreground/40", heightClass)}
            style={{ left: `${Math.min(expectedValue, 100)}%` }}
            title={`Esperado: ${Math.round(expectedValue)}%`}
          />
        )}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
