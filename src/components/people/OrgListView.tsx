import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Building2, Users, Network } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

interface OrgListViewProps {
  hierarchy: HierarchyNode | null;
  search: string;
  onSelectMember: (node: HierarchyNode) => void;
  myUserNodeId: string | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function countMembers(node: HierarchyNode): number {
  // Count this node if it's a person (member) AND walk children — a person
  // can have direct reports, so we still need to recurse.
  let count = node.type === "member" ? 1 : 0;
  for (const c of node.children ?? []) count += countMembers(c);
  return count;
}

function nodeMatches(node: HierarchyNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [node.name, node.role, node.position, node.email, node.department]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return true;
  return (node.children ?? []).some((c) => nodeMatches(c, q));
}

function NodeIcon({ type }: { type: HierarchyNode["type"] }) {
  if (type === "company") return <Network className="h-4 w-4 text-primary shrink-0" />;
  if (type === "department") return <Building2 className="h-4 w-4 text-primary shrink-0" />;
  if (type === "team") return <Users className="h-4 w-4 text-muted-foreground shrink-0" />;
  return null;
}

function TreeRow({
  node,
  depth,
  search,
  onSelectMember,
  defaultExpanded,
  myUserNodeId,
}: {
  node: HierarchyNode;
  depth: number;
  search: string;
  onSelectMember: (node: HierarchyNode) => void;
  defaultExpanded: boolean;
  myUserNodeId: string | null;
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const memberCount = node.type === "member" ? 0 : countMembers(node);
  const isMember = node.type === "member";
  const isMe = node.id === myUserNodeId;

  const matchesQuery = search ? nodeMatches(node, search) : true;
  if (!matchesQuery) return null;

  // Auto-expand groups when there's an active search
  const effectiveOpen = search ? true : open;

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors",
          isMember && "cursor-pointer",
          isMe && "bg-primary/5 ring-1 ring-primary/20",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isMember) onSelectMember(node);
          else setOpen((v) => !v);
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={effectiveOpen ? "Recolher" : "Expandir"}
          >
            {effectiveOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-5 w-5 inline-block shrink-0" />
        )}

        {isMember ? (
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={node.avatarUrl} alt={node.name} />
            <AvatarFallback className="text-[10px] bg-muted">
              {getInitials(node.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <NodeIcon type={node.type} />
        )}

        <div className="min-w-0 flex-1 flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              !isMember && "font-semibold",
              isMember && "font-medium",
            )}
          >
            {node.name}
            {isMe && (
              <span className="ml-2 text-[10px] text-primary font-semibold">VOCÊ</span>
            )}
          </p>
          {(node.position || (node.role && node.role !== node.name)) && (
            <p className="truncate text-xs text-muted-foreground hidden sm:block">
              {node.position || node.role}
            </p>
          )}
        </div>

        {!isMember && memberCount > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
            {memberCount}
          </Badge>
        )}
      </div>

      {hasChildren && effectiveOpen && (
        <>
          {node.children!.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              search={search}
              onSelectMember={onSelectMember}
              // Expand the first 2 levels by default so CEO + C-Level + Heads
              // are visible immediately. Squad members stay collapsed.
              defaultExpanded={defaultExpanded && depth < 2}
              myUserNodeId={myUserNodeId}
            />
          ))}
        </>
      )}
    </>
  );
}

export function OrgListView({
  hierarchy,
  search,
  onSelectMember,
  myUserNodeId,
}: OrgListViewProps) {
  const totalPeople = useMemo(
    () => (hierarchy ? countMembers(hierarchy) : 0),
    [hierarchy],
  );

  if (!hierarchy) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Sem dados para exibir.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      <div className="px-2 pb-2 text-xs text-muted-foreground">
        {totalPeople} {totalPeople === 1 ? "pessoa" : "pessoas"}
        {search ? ` • filtrando "${search}"` : ""}
      </div>
      <TreeRow
        node={hierarchy}
        depth={0}
        search={search}
        onSelectMember={onSelectMember}
        defaultExpanded={true}
        myUserNodeId={myUserNodeId}
      />
    </div>
  );
}
