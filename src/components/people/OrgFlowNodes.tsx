import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgFlowNodeData } from "./org-layout";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const cardBase =
  "flex items-center gap-3 px-4 py-3 rounded-lg border bg-card shadow-sm transition-all";

function dimClass(isDimmed: boolean) {
  return isDimmed ? "opacity-30" : "opacity-100";
}

function highlightClass(isHighlighted: boolean) {
  return isHighlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "";
}

export const OrgRootNode = memo(({ data }: NodeProps<OrgFlowNodeData>) => (
  <div
    className={cn(
      cardBase,
      "border-primary/40 bg-primary/5 min-w-[220px]",
      dimClass(data.isDimmed),
      highlightClass(data.isHighlighted),
    )}
  >
    <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    <Avatar className="h-10 w-10 shrink-0">
      <AvatarImage src={data.avatarUrl} alt={data.name} />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
        {getInitials(data.name)}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="font-semibold text-sm truncate">{data.name}</p>
      <p className="text-xs text-muted-foreground truncate">{data.position || data.role}</p>
    </div>
  </div>
));
OrgRootNode.displayName = "OrgRootNode";

export const OrgDeptNode = memo(({ data }: NodeProps<OrgFlowNodeData>) => {
  const color = data.color || "hsl(var(--primary))";
  return (
    <div
      className={cn(cardBase, "min-w-[220px]", dimClass(data.isDimmed), highlightClass(data.isHighlighted))}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Building2 className="h-5 w-5 shrink-0" style={{ color }} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{data.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {data.role !== "Sem líder" ? data.role : "Sem líder"}
        </p>
      </div>
    </div>
  );
});
OrgDeptNode.displayName = "OrgDeptNode";

export const OrgTeamNode = memo(({ data }: NodeProps<OrgFlowNodeData>) => (
  <div
    className={cn(
      cardBase,
      "min-w-[200px] bg-secondary/40",
      dimClass(data.isDimmed),
      highlightClass(data.isHighlighted),
    )}
  >
    <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
    <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0 flex-1">
      <p className="font-medium text-sm truncate">{data.name}</p>
      <p className="text-xs text-muted-foreground truncate">{data.role}</p>
    </div>
  </div>
));
OrgTeamNode.displayName = "OrgTeamNode";

export const OrgMemberNode = memo(({ data }: NodeProps<OrgFlowNodeData>) => (
  <div
    className={cn(
      cardBase,
      "min-w-[200px]",
      dimClass(data.isDimmed),
      highlightClass(data.isHighlighted),
    )}
  >
    <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarImage src={data.avatarUrl} alt={data.name} />
      <AvatarFallback className="text-[10px] bg-muted">{getInitials(data.name)}</AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <p className="font-medium text-sm truncate">{data.name}</p>
      <p className="text-xs text-muted-foreground truncate">{data.position || data.role}</p>
    </div>
  </div>
));
OrgMemberNode.displayName = "OrgMemberNode";
