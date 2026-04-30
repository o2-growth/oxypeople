import { describe, it, expect } from "vitest";
import { buildOrgGraph, flattenHierarchy } from "./org-layout";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

function makeNode(id: string, type: HierarchyNode["type"], children: HierarchyNode[] = []): HierarchyNode {
  return {
    id,
    type,
    name: id,
    role: "",
    children,
  };
}

const sampleTree: HierarchyNode = makeNode("company-1", "company", [
  makeNode("dept-eng", "department", [
    makeNode("team-frontend", "team", [
      makeNode("member-alice", "member"),
      makeNode("member-bob", "member"),
    ]),
    makeNode("team-backend", "team", [makeNode("member-carol", "member")]),
  ]),
  makeNode("dept-marketing", "department", [makeNode("member-dave", "member")]),
]);

describe("org-layout", () => {
  it("flattenHierarchy returns every node exactly once", () => {
    const flat = flattenHierarchy(sampleTree);
    expect(flat).toHaveLength(9);
    const ids = flat.map((n) => n.id);
    expect(new Set(ids).size).toBe(9);
  });

  it("buildOrgGraph emits a node and edge per parent/child relation", () => {
    const { nodes, edges } = buildOrgGraph(sampleTree);
    expect(nodes).toHaveLength(9);
    expect(edges).toHaveLength(8);
    const sources = edges.map((e) => e.source);
    expect(sources).toContain("company-1");
    expect(sources).toContain("dept-eng");
    expect(sources).toContain("team-frontend");
  });

  it("nodes use the correct reactflow type per HierarchyNode.type", () => {
    const { nodes } = buildOrgGraph(sampleTree);
    expect(nodes.find((n) => n.id === "company-1")?.type).toBe("orgRoot");
    expect(nodes.find((n) => n.id === "dept-eng")?.type).toBe("orgDept");
    expect(nodes.find((n) => n.id === "team-frontend")?.type).toBe("orgTeam");
    expect(nodes.find((n) => n.id === "member-alice")?.type).toBe("orgMember");
  });

  it("when no filter is active, every node has isHighlighted=false and isDimmed=false", () => {
    const { nodes } = buildOrgGraph(sampleTree, () => false);
    for (const node of nodes) {
      expect(node.data.isHighlighted).toBe(false);
      expect(node.data.isDimmed).toBe(false);
    }
  });

  it("when a filter matches a leaf, ancestors are highlighted and unrelated nodes dimmed", () => {
    const { nodes } = buildOrgGraph(sampleTree, (n) => n.id === "member-alice");
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("member-alice")?.data.isHighlighted).toBe(true);
    expect(byId.get("team-frontend")?.data.isHighlighted).toBe(true);
    expect(byId.get("dept-eng")?.data.isHighlighted).toBe(true);
    expect(byId.get("company-1")?.data.isHighlighted).toBe(true);
    expect(byId.get("member-bob")?.data.isDimmed).toBe(true);
    expect(byId.get("member-dave")?.data.isDimmed).toBe(true);
    expect(byId.get("dept-marketing")?.data.isDimmed).toBe(true);
  });

  it("when filter matches a department, its descendants are highlighted", () => {
    const { nodes } = buildOrgGraph(sampleTree, (n) => n.id === "dept-eng");
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("dept-eng")?.data.isHighlighted).toBe(true);
    expect(byId.get("team-frontend")?.data.isHighlighted).toBe(true);
    expect(byId.get("member-alice")?.data.isHighlighted).toBe(true);
    expect(byId.get("dept-marketing")?.data.isDimmed).toBe(true);
    expect(byId.get("member-dave")?.data.isDimmed).toBe(true);
  });

  it("layout positions parent above the centroid of its direct children", () => {
    const { nodes } = buildOrgGraph(sampleTree);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const dept = byId.get("dept-eng");
    const teamA = byId.get("team-frontend");
    const teamB = byId.get("team-backend");
    expect(dept).toBeDefined();
    expect(teamA).toBeDefined();
    expect(teamB).toBeDefined();
    if (dept && teamA && teamB) {
      const expected = (teamA.position.x + teamB.position.x) / 2;
      expect(dept.position.x).toBeCloseTo(expected, 5);
      expect(teamA.position.y).toBeGreaterThan(dept.position.y);
    }
  });
});
