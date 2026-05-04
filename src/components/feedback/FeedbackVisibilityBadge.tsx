import { Lock, Eye, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackVisibilityBadgeProps {
  visibility: "private_requester" | "shared_with_subject" | "shared_with_manager";
  className?: string;
}

const META = {
  private_requester: { icon: Lock, label: "Privada", color: "text-muted-foreground" },
  shared_with_subject: { icon: Eye, label: "Compartilhada", color: "text-blue-500" },
  shared_with_manager: { icon: Network, label: "Com gestor", color: "text-amber-500" },
} as const;

export function FeedbackVisibilityBadge({ visibility, className }: FeedbackVisibilityBadgeProps) {
  const m = META[visibility];
  const Icon = m.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)}>
      <Icon className={cn("h-3 w-3", m.color)} />
      {m.label}
    </Badge>
  );
}
