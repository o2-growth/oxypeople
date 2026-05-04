import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { nineBoxCellName, nineBoxCellTheme } from "@/lib/nineBox/performanceBucket";
import { PlacementCard } from "./PlacementCard";
import type { NineBoxPlacement } from "@/hooks/useNineBoxSnapshot";

interface NineBoxCellProps {
  performance: number;
  potential: number;
  placements: NineBoxPlacement[];
  disabled: boolean;
  onRemove: (placementId: string) => void;
}

export function NineBoxCell({
  performance,
  potential,
  placements,
  disabled,
  onRemove,
}: NineBoxCellProps) {
  const id = `cell-${performance}-${potential}`;
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const theme = nineBoxCellTheme(performance, potential);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex flex-col rounded-md border-2 p-2 min-h-[150px] transition-colors",
        theme.bg,
        theme.border,
        isOver && !disabled && "ring-2 ring-primary border-primary",
        disabled && "opacity-80",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className={cn("text-[11px] font-semibold uppercase tracking-wide", theme.text)}>
          {nineBoxCellName(performance, potential)}
        </p>
        <Badge variant="secondary" className="h-4 text-[9px] px-1.5">
          {placements.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1 content-start">
        {placements.length === 0 ? (
          <p className="w-full pt-2 text-center text-[10px] text-muted-foreground/60">
            Arraste pessoas aqui
          </p>
        ) : (
          placements.map((p) => (
            <PlacementCard
              key={p.id}
              id={p.id}
              user={p.user}
              source={p.performance_source}
              rawScore={p.raw_evaluation_score}
              disabled={disabled}
              onRemove={() => onRemove(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
