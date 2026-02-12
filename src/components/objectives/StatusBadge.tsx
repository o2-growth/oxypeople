import { cn } from "@/lib/utils";

export type OKRStatus = "on_track" | "attention" | "risk" | "no_data" | "completed" | "overdue";

const statusMap: Record<OKRStatus, { label: string; bg: string }> = {
  on_track: { label: "On Track", bg: "bg-[#00c875]" },
  attention: { label: "Atenção", bg: "bg-[#fdab3d]" },
  risk: { label: "Em Risco", bg: "bg-[#e2445c]" },
  no_data: { label: "Sem dados", bg: "bg-[#c4c4c4]" },
  completed: { label: "Concluído", bg: "bg-[#00c875]" },
  overdue: { label: "Atrasado", bg: "bg-[#e2445c]" },
};

interface StatusBadgeProps {
  status: OKRStatus | string;
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, showLabel = true, className }: StatusBadgeProps) {
  const config = statusMap[status as OKRStatus] || statusMap.no_data;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 rounded-sm text-[11px] font-semibold text-white min-w-[80px] text-center select-none",
        config.bg,
        className
      )}
    >
      {showLabel && config.label}
    </div>
  );
}
