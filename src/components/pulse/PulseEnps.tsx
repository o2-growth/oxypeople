import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PulseEnpsProps {
  selected: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean;
}

function colorFor(n: number): string {
  if (n <= 6) return "bg-destructive/10 hover:bg-destructive/20 text-destructive";
  if (n <= 8) return "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600";
  return "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600";
}

export function PulseEnps({ selected, onSelect, disabled }: PulseEnpsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const active = selected === n;
          return (
            <Button
              key={n}
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onSelect(n)}
              className={cn(
                "h-10 text-sm font-semibold transition-all",
                colorFor(n),
                active && "ring-2 ring-primary scale-110",
              )}
            >
              {n}
            </Button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-destructive">0–6 Detratores</span>
        <span className="text-amber-600">7–8 Passivos</span>
        <span className="text-emerald-600">9–10 Promotores</span>
      </div>
    </div>
  );
}
