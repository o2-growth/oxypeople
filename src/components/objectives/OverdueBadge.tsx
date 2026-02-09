import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OverdueBadgeProps {
  overdue: boolean;
  label?: string;
  className?: string;
}

export function OverdueBadge({ overdue, label = "Check-in atrasado", className }: OverdueBadgeProps) {
  if (!overdue) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-5 gap-1 bg-red-500/10 text-red-500 border-red-500/30",
        className
      )}
    >
      <Clock className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
