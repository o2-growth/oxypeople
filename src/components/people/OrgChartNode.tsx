import { ChevronDown, ChevronRight, Building2, Users, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

interface OrgChartNodeProps {
  node: HierarchyNode;
  isExpanded: boolean;
  onToggle: () => void;
  level: number;
  isLast?: boolean;
  hasConnector?: boolean;
}

const typeStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  company: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: <Building2 className="h-4 w-4 text-primary" />,
  },
  department: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    icon: <Building2 className="h-4 w-4 text-accent" />,
  },
  team: {
    bg: "bg-success/10",
    border: "border-success/30",
    icon: <Users className="h-4 w-4 text-success" />,
  },
  member: {
    bg: "bg-muted",
    border: "border-border",
    icon: <User className="h-4 w-4 text-muted-foreground" />,
  },
};

const roleLabels: Record<string, string> = {
  company: "Proprietário",
  department: "Líder do Departamento",
  team: "Líder da Equipe",
  member: "Colaborador",
};

export function OrgChartNode({
  node,
  isExpanded,
  onToggle,
  level,
  isLast = false,
  hasConnector = true,
}: OrgChartNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const styles = typeStyles[node.type] || typeStyles.member;
  const initials = node.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      {/* Vertical connector line from parent */}
      {hasConnector && level > 0 && (
        <div
          className="absolute left-6 -top-4 w-px h-4 bg-border"
          style={{ marginLeft: "-0.5px" }}
        />
      )}

      {/* Node card */}
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
          styles.bg,
          styles.border,
          hasChildren && "pr-10"
        )}
        style={
          node.type === "department" && node.color
            ? {
                backgroundColor: `${node.color}15`,
                borderColor: `${node.color}40`,
              }
            : undefined
        }
        onClick={() => hasChildren && onToggle()}
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={node.avatarUrl} alt={node.name} />
          <AvatarFallback
            className={cn(
              node.type === "department" && node.color
                ? "text-white"
                : "bg-muted"
            )}
            style={
              node.type === "department" && node.color
                ? { backgroundColor: node.color }
                : undefined
            }
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {styles.icon}
            <span className="font-medium text-sm truncate">{node.name}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {node.type === "member" ? roleLabels.member : node.role}
          </p>
        </div>

        {hasChildren && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-background/50 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Children container */}
      {hasChildren && isExpanded && (
        <div className="relative mt-2 ml-6 pl-6 border-l-2 border-border space-y-2">
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector */}
              <div className="absolute -left-6 top-6 w-6 h-px bg-border" />
              {/* Render child - we'll pass expanded state from parent component */}
              <OrgChartNodeWrapper
                node={child}
                level={level + 1}
                isLast={index === node.children.length - 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper component to handle its own expanded state
interface OrgChartNodeWrapperProps {
  node: HierarchyNode;
  level: number;
  isLast?: boolean;
  expandedNodes?: Set<string>;
  onToggleNode?: (nodeId: string) => void;
}

export function OrgChartNodeWrapper({
  node,
  level,
  isLast,
  expandedNodes,
  onToggleNode,
}: OrgChartNodeWrapperProps) {
  // Use external state if provided, otherwise use internal
  const isExpanded = expandedNodes?.has(node.id) ?? false;

  const handleToggle = () => {
    onToggleNode?.(node.id);
  };

  return (
    <OrgChartNodeControlled
      node={node}
      isExpanded={isExpanded}
      onToggle={handleToggle}
      level={level}
      isLast={isLast}
      expandedNodes={expandedNodes}
      onToggleNode={onToggleNode}
    />
  );
}

// Controlled version that uses external state
interface OrgChartNodeControlledProps {
  node: HierarchyNode;
  isExpanded: boolean;
  onToggle: () => void;
  level: number;
  isLast?: boolean;
  hasConnector?: boolean;
  expandedNodes?: Set<string>;
  onToggleNode?: (nodeId: string) => void;
}

export function OrgChartNodeControlled({
  node,
  isExpanded,
  onToggle,
  level,
  isLast = false,
  hasConnector = true,
  expandedNodes,
  onToggleNode,
}: OrgChartNodeControlledProps) {
  const hasChildren = node.children && node.children.length > 0;
  const styles = typeStyles[node.type] || typeStyles.member;
  const initials = node.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      {/* Vertical connector line from parent */}
      {hasConnector && level > 0 && (
        <div
          className="absolute left-6 -top-4 w-px h-4 bg-border"
          style={{ marginLeft: "-0.5px" }}
        />
      )}

      {/* Node card */}
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
          styles.bg,
          styles.border,
          hasChildren && "pr-10 cursor-pointer hover:shadow-md"
        )}
        style={
          node.type === "department" && node.color
            ? {
                backgroundColor: `${node.color}15`,
                borderColor: `${node.color}40`,
              }
            : undefined
        }
        onClick={() => hasChildren && onToggle()}
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={node.avatarUrl} alt={node.name} />
          <AvatarFallback
            className={cn(
              node.type === "department" && node.color
                ? "text-white"
                : "bg-muted"
            )}
            style={
              node.type === "department" && node.color
                ? { backgroundColor: node.color }
                : undefined
            }
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {styles.icon}
            <span className="font-medium text-sm truncate">{node.name}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {node.type === "member" ? roleLabels.member : node.role}
          </p>
        </div>

        {hasChildren && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-background/50 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Children container */}
      {hasChildren && isExpanded && (
        <div className="relative mt-2 ml-6 pl-6 border-l-2 border-border space-y-2">
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector */}
              <div className="absolute -left-6 top-6 w-6 h-px bg-border" />
              <OrgChartNodeControlled
                node={child}
                isExpanded={expandedNodes?.has(child.id) ?? false}
                onToggle={() => onToggleNode?.(child.id)}
                level={level + 1}
                isLast={index === node.children.length - 1}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
