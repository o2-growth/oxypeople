import { Badge } from "@/components/ui/badge";
import { Rocket, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitmentType = "committed" | "aspirational";

interface CommitmentTypeBadgeProps {
  value: CommitmentType | string | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export function CommitmentTypeBadge({ value, className, showIcon = true }: CommitmentTypeBadgeProps) {
  const type: CommitmentType = value === "aspirational" ? "aspirational" : "committed";

  if (type === "aspirational") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border-purple-500/40 bg-purple-500/10 text-purple-400",
          className,
        )}
      >
        {showIcon && <Rocket className="h-3 w-3" />}
        Moonshot — 70% já é vitória
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        className,
      )}
    >
      {showIcon && <CheckCircle2 className="h-3 w-3" />}
      Entrega esperada
    </Badge>
  );
}
