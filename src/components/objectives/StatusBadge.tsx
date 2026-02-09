import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type OKRStatus = "on_track" | "attention" | "risk" | "no_data" | "completed" | "overdue";

const statusMap: Record<OKRStatus, { label: string; className: string; emoji: string }> = {
  on_track: { label: "On Track", className: "bg-success/10 text-success border-success/25", emoji: "✅" },
  attention: { label: "Atenção", className: "bg-warning/10 text-warning border-warning/25", emoji: "⚠️" },
  risk: { label: "Em Risco", className: "bg-destructive/10 text-destructive border-destructive/25", emoji: "🔴" },
  no_data: { label: "Sem dados", className: "bg-muted text-muted-foreground border-border", emoji: "—" },
  completed: { label: "Concluído", className: "bg-primary/10 text-primary border-primary/25", emoji: "🏁" },
  overdue: { label: "Atrasado", className: "bg-destructive/10 text-destructive border-destructive/25", emoji: "⏰" },
};

interface StatusBadgeProps {
  status: OKRStatus | string;
  variant?: "solid" | "soft";
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, variant = "soft", showLabel = true, className }: StatusBadgeProps) {
  const config = statusMap[status as OKRStatus] || statusMap.no_data;

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0 gap-1 rounded-full", config.className, className)}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
