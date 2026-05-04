import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PulseScale1to5Props {
  selected: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean;
}

const LABELS = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"];

export function PulseScale1to5({ selected, onSelect, disabled }: PulseScale1to5Props) {
  const [hover, setHover] = useState<number | null>(null);
  const indicator = hover ?? selected;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            type="button"
            variant={selected === n ? "default" : "outline"}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect(n)}
            className={cn(
              "h-12 text-base font-semibold transition-transform",
              selected === n && "scale-105 shadow-md",
            )}
          >
            {n}
          </Button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground min-h-[1.25rem]">
        {indicator ? LABELS[indicator - 1] : "Toque para responder"}
      </p>
    </div>
  );
}
