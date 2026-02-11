import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

interface OrgCardProps {
  node: HierarchyNode;
  borderColor?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Compact card used for the CEO / top-level node */
export function OrgRootCard({ node }: OrgCardProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center gap-3 px-6 py-4 rounded-xl border bg-card shadow-sm min-w-[200px]">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={node.avatarUrl} alt={node.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {getInitials(node.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{node.name}</p>
          <p className="text-xs text-muted-foreground truncate">{node.position || node.role}</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
      </div>
    </div>
  );
}

/** Department head card — shows department name, role, and position */
export function OrgDeptHeadCard({ node, borderColor }: OrgCardProps) {
  return (
    <div className="relative flex items-center gap-3 px-4 py-3 rounded-lg border bg-card shadow-sm min-w-[180px]">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={node.avatarUrl} alt={node.name} />
        <AvatarFallback
          className="text-xs font-medium text-white"
          style={{ backgroundColor: borderColor || "hsl(var(--primary))" }}
        >
          {getInitials(node.role || node.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{node.role || node.name}</p>
        <p className="text-xs text-muted-foreground truncate">{node.name}</p>
        <p className="text-xs text-muted-foreground truncate">{node.position || ""}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </div>
  );
}

/** Member row card — compact with colored left border */
export function OrgMemberCard({ node, borderColor }: OrgCardProps) {
  return (
    <div
      className="relative flex items-center gap-3 px-4 py-2.5 border bg-card rounded-md shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor || "hsl(var(--border))" }}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={node.avatarUrl} alt={node.name} />
        <AvatarFallback className="text-[10px] bg-muted font-medium">
          {getInitials(node.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{node.name}</p>
        <p className="text-xs text-muted-foreground truncate">{node.department || ""}</p>
        <p className="text-xs text-muted-foreground truncate">{node.position || node.role}</p>
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
    </div>
  );
}

/** A full department column — head card + vertical list of members */
export function OrgDepartmentColumn({ node }: { node: HierarchyNode }) {
  const color = node.color || "hsl(var(--primary))";

  // Flatten: if dept has teams, merge their children into a flat list
  const allMembers: HierarchyNode[] = [];
  node.children?.forEach((child) => {
    if (child.type === "team") {
      child.children?.forEach((m) => allMembers.push({ ...m, department: node.name }));
    } else {
      allMembers.push({ ...child, department: node.name });
    }
  });

  return (
    <div className="flex flex-col items-stretch min-w-[200px] max-w-[240px]">
      {/* Vertical connector from horizontal line to head */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-border" />
      </div>

      <OrgDeptHeadCard node={node} borderColor={color} />

      {allMembers.length > 0 && (
        <div
          className="mt-1 space-y-1 ml-0"
          style={{ borderLeftWidth: 3, borderLeftColor: color, borderLeftStyle: "solid", paddingLeft: 0 }}
        >
          {allMembers.map((member) => (
            <OrgMemberCard key={member.id} node={member} borderColor={color} />
          ))}
        </div>
      )}
    </div>
  );
}
