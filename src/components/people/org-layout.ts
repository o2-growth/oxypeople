import type { Node, Edge } from "reactflow";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const HORIZONTAL_GAP = 24;
const VERTICAL_GAP = 56;

export type OrgFlowNodeData = HierarchyNode & {
  isHighlighted: boolean;
  isDimmed: boolean;
};

type Layout = {
  width: number;
  positions: Map<string, { x: number; y: number }>;
};

function layoutSubtree(node: HierarchyNode, depth: number, leftX: number): Layout {
  const positions = new Map<string, { x: number; y: number }>();
  const children = node.children ?? [];

  if (children.length === 0) {
    const x = leftX;
    const y = depth * (NODE_HEIGHT + VERTICAL_GAP);
    positions.set(node.id, { x, y });
    return { width: NODE_WIDTH, positions };
  }

  let cursor = leftX;
  const childLayouts: Layout[] = [];
  for (const child of children) {
    const childLayout = layoutSubtree(child, depth + 1, cursor);
    childLayouts.push(childLayout);
    childLayout.positions.forEach((value, key) => positions.set(key, value));
    cursor += childLayout.width + HORIZONTAL_GAP;
  }

  const childrenWidth = cursor - leftX - HORIZONTAL_GAP;
  const totalWidth = Math.max(NODE_WIDTH, childrenWidth);

  const firstChildX = childLayouts[0]?.positions.get(children[0].id)?.x ?? leftX;
  const lastChildX =
    childLayouts[childLayouts.length - 1]?.positions.get(children[children.length - 1].id)?.x ?? leftX;

  positions.set(node.id, {
    x: (firstChildX + lastChildX) / 2,
    y: depth * (NODE_HEIGHT + VERTICAL_GAP),
  });

  return { width: totalWidth, positions };
}

export function buildOrgGraph(
  root: HierarchyNode,
  filterMatch: (node: HierarchyNode) => boolean = () => true
): { nodes: Node<OrgFlowNodeData>[]; edges: Edge[] } {
  const layout = layoutSubtree(root, 0, 0);
  const matchingIds = collectMatches(root, filterMatch);
  const hasFilter = matchingIds.size > 0 && matchingIds.size < countAll(root);

  const nodes: Node<OrgFlowNodeData>[] = [];
  const edges: Edge[] = [];

  walk(root, (node, parent) => {
    const pos = layout.positions.get(node.id);
    if (!pos) return;
    const matched = matchingIds.has(node.id);
    nodes.push({
      id: node.id,
      type: nodeKind(node.type),
      position: pos,
      data: {
        ...node,
        isHighlighted: hasFilter && matched,
        isDimmed: hasFilter && !matched,
      },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    if (parent) {
      edges.push({
        id: `${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: "smoothstep",
        style: hasFilter && !(matched || matchingIds.has(parent.id))
          ? { stroke: "hsl(var(--muted))", strokeOpacity: 0.4 }
          : { stroke: "hsl(var(--border))" },
      });
    }
  });

  return { nodes, edges };
}

function nodeKind(type: HierarchyNode["type"]): string {
  return type === "company" ? "orgRoot" : type === "department" ? "orgDept" : type === "team" ? "orgTeam" : "orgMember";
}

function walk(
  node: HierarchyNode,
  visit: (node: HierarchyNode, parent: HierarchyNode | null) => void,
  parent: HierarchyNode | null = null,
) {
  visit(node, parent);
  for (const child of node.children ?? []) walk(child, visit, node);
}

function countAll(node: HierarchyNode): number {
  let count = 1;
  for (const child of node.children ?? []) count += countAll(child);
  return count;
}

function collectMatches(
  root: HierarchyNode,
  predicate: (node: HierarchyNode) => boolean,
): Set<string> {
  const matches = new Set<string>();
  const ancestors: HierarchyNode[] = [];

  function visit(node: HierarchyNode) {
    ancestors.push(node);
    if (predicate(node)) {
      ancestors.forEach((a) => matches.add(a.id));
      collectAllDescendants(node, matches);
    }
    for (const child of node.children ?? []) visit(child);
    ancestors.pop();
  }

  visit(root);
  return matches;
}

function collectAllDescendants(node: HierarchyNode, into: Set<string>) {
  for (const child of node.children ?? []) {
    into.add(child.id);
    collectAllDescendants(child, into);
  }
}

export function flattenHierarchy(root: HierarchyNode): HierarchyNode[] {
  const out: HierarchyNode[] = [];
  walk(root, (n) => out.push(n));
  return out;
}
