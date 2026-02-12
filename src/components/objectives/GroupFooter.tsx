import { Plus } from "lucide-react";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";

interface GroupFooterProps {
  objectives: ObjectiveWithDetails[];
  onAddItem: () => void;
}

export function GroupFooter({ objectives, onAddItem }: GroupFooterProps) {
  const avgProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0;

  return (
    <div className="flex items-center h-9 border-t border-border/30">
      <button
        onClick={onAddItem}
        className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus className="h-3 w-3" />
        Adicionar
      </button>
      <div className="flex-1" />
      {/* Aggregation columns aligned with progress column */}
      <div className="w-[100px]" />
      <div className="w-[100px]" />
      <div className="w-[90px]" />
      <div className="w-[130px] flex items-center gap-2 px-3">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00c875]"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground w-8 text-right tabular-nums">
          {avgProgress}%
        </span>
      </div>
      <div className="w-[44px] flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">{objectives.length}</span>
      </div>
      <div className="w-[50px]" />
      <div className="w-[60px]" />
      <div className="w-[36px]" />
    </div>
  );
}
