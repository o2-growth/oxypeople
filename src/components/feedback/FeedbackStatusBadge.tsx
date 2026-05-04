import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";

interface FeedbackStatusBadgeProps {
  status: "requested" | "answered" | "declined" | "expired";
  className?: string;
}

const META = {
  requested: { icon: Clock, label: "Pendente", classes: "border-amber-500/40 text-amber-600" },
  answered: {
    icon: CheckCircle2,
    label: "Respondido",
    classes: "border-emerald-500/40 text-emerald-600",
  },
  declined: {
    icon: XCircle,
    label: "Recusado",
    classes: "border-muted-foreground/40 text-muted-foreground",
  },
  expired: { icon: Hourglass, label: "Expirado", classes: "border-destructive/40 text-destructive" },
} as const;

export function FeedbackStatusBadge({ status, className }: FeedbackStatusBadgeProps) {
  const m = META[status];
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", m.classes, className)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}
