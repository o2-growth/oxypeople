import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type OKRStatus = "on_track" | "attention" | "risk" | "no_data" | "completed" | "overdue";

const statusMap: Record<OKRStatus, { label: string; className: string; emoji: string }> = {
  on_track: { label: "On Track", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", emoji: "✅" },
  attention: { label: "Atenção", className: "bg-amber-500/10 text-amber-500 border-amber-500/30", emoji: "⚠️" },
  risk: { label: "Em Risco", className: "bg-red-500/10 text-red-500 border-red-500/30", emoji: "🔴" },
  no_data: { label: "Sem dados", className: "bg-muted text-muted-foreground border-border", emoji: "—" },
  completed: { label: "Concluído", className: "bg-blue-500/10 text-blue-500 border-blue-500/30", emoji: "🏁" },
  overdue: { label: "Atrasado", className: "bg-red-600/10 text-red-600 border-red-600/30", emoji: "⏰" },
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
      className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0 gap-1", config.className, className)}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
