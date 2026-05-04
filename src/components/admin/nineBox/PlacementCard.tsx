import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlacementCardProps {
  id: string;
  user: { id: string; full_name: string | null; avatar_url: string | null } | null;
  source?: "auto" | "manual" | "auto_overridden";
  rawScore?: number | null;
  disabled?: boolean;
  onRemove?: () => void;
}

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PlacementCard({
  id,
  user,
  source,
  rawScore,
  disabled,
  onRemove,
}: PlacementCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "group flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-xs shadow-sm",
        !disabled && "cursor-grab active:cursor-grabbing hover:border-primary",
        disabled && "opacity-80",
      )}
      title={user?.full_name ?? "Sem nome"}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
      <Avatar className="h-5 w-5 shrink-0">
        <AvatarImage src={user?.avatar_url ?? undefined} />
        <AvatarFallback className="text-[9px]">
          {initialsOf(user?.full_name ?? null)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate flex-1 min-w-0 max-w-[140px]">
        {user?.full_name ?? "—"}
      </span>
      {source === "auto_overridden" && (
        <Badge variant="outline" className="h-4 px-1 text-[8px]">M</Badge>
      )}
      {rawScore != null && source !== "manual" && (
        <span className="text-[9px] text-muted-foreground tabular-nums">
          {rawScore.toFixed(1)}
        </span>
      )}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          aria-label="Remover do snapshot"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
