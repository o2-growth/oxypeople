import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableSectionProps {
  title: string;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableSection({
  title,
  defaultOpen = false,
  rightSlot,
  children,
  className,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-medium flex-1">{title}</span>
        {rightSlot}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
