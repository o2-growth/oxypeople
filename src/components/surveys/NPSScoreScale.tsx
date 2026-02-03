import { cn } from "@/lib/utils";

interface NPSScoreScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const getScoreColor = (score: number) => {
  if (score <= 6) return "bg-destructive text-destructive-foreground";
  if (score <= 8) return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
};

const getScoreLabel = (score: number) => {
  if (score <= 6) return "Detrator";
  if (score <= 8) return "Neutro";
  return "Promotor";
};

export function NPSScoreScale({
  value,
  onChange,
  disabled = false,
  showLabels = true,
}: NPSScoreScaleProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-lg font-semibold text-sm sm:text-base transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              value === score
                ? cn(getScoreColor(score), "border-transparent scale-110 shadow-lg")
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:bg-muted",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {score}
          </button>
        ))}
      </div>
      
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className="text-destructive font-medium">Nada provável</span>
          <span className="text-success font-medium">Muito provável</span>
        </div>
      )}

      {value !== null && showLabels && (
        <div className="text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
              value <= 6 && "bg-destructive/10 text-destructive",
              value >= 7 && value <= 8 && "bg-warning/10 text-warning",
              value >= 9 && "bg-success/10 text-success"
            )}
          >
            {getScoreLabel(value)} ({value}/10)
          </span>
        </div>
      )}
    </div>
  );
}
