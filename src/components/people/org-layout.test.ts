import { describe, it, expect } from "vitest";
import {
  buildOrgGraph,
  flattenHierarchy,
  buildManagerHierarchy,
  type ManagerMembershipInput,
  type ManagerUserInput,
} from "./org-layout";
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

  it("buildManagerHierarchy: empty memberships returns null", () => {
    expect(buildManagerHierarchy([], [])).toBeNull();
  });

  it("buildManagerHierarchy: single root with no children", () => {
    const memberships: ManagerMembershipInput[] = [
      { user_id: "u-ceo", manager_id: null, position: "CEO" },
    ];
    const users: ManagerUserInput[] = [
      { id: "u-ceo", full_name: "Ana", email: "ana@x.com" },
    ];
    const tree = buildManagerHierarchy(memberships, users);
    expect(tree).not.toBeNull();
    expect(tree?.id).toBe("member-u-ceo");
    expect(tree?.name).toBe("Ana");
    expect(tree?.children).toHaveLength(0);
  });

  it("buildManagerHierarchy: 2-level chain (CEO → Manager → IC)", () => {
    const memberships: ManagerMembershipInput[] = [
      { user_id: "u-ceo", manager_id: null },
      { user_id: "u-mgr", manager_id: "u-ceo" },
      { user_id: "u-ic", manager_id: "u-mgr" },
    ];
    const users: ManagerUserInput[] = [
      { id: "u-ceo", full_name: "CEO", email: "ceo@x.com" },
      { id: "u-mgr", full_name: "Mgr", email: "mgr@x.com" },
      { id: "u-ic", full_name: "IC", email: "ic@x.com" },
    ];
    const tree = buildManagerHierarchy(memberships, users);
    expect(tree?.id).toBe("member-u-ceo");
    expect(tree?.children).toHaveLength(1);
    expect(tree?.children[0].id).toBe("member-u-mgr");
    expect(tree?.children[0].children).toHaveLength(1);
    expect(tree?.children[0].children[0].id).toBe("member-u-ic");
  });

  it("buildManagerHierarchy: multiple roots → synthetic 'manager-root' wrapper", () => {
    const memberships: ManagerMembershipInput[] = [
      { user_id: "u-1", manager_id: null },
      { user_id: "u-2", manager_id: null },
      { user_id: "u-3", manager_id: "u-1" },
    ];
    const users: ManagerUserInput[] = [
      { id: "u-1", full_name: "One", email: "1@x.com" },
      { id: "u-2", full_name: "Two", email: "2@x.com" },
      { id: "u-3", full_name: "Three", email: "3@x.com" },
    ];
    const tree = buildManagerHierarchy(memberships, users);
    expect(tree?.id).toBe("manager-root");
    expect(tree?.type).toBe("company");
    expect(tree?.children).toHaveLength(2);
    const ids = tree?.children.map((c) => c.id);
    expect(ids).toContain("member-u-1");
    expect(ids).toContain("member-u-2");
    const u1 = tree?.children.find((c) => c.id === "member-u-1");
    expect(u1?.children).toHaveLength(1);
    expect(u1?.children[0].id).toBe("member-u-3");
  });

  it("buildManagerHierarchy: orphan manager_id pointing outside membership set is treated as root", () => {
    const memberships: ManagerMembershipInput[] = [
      { user_id: "u-orphan", manager_id: "u-not-here" },
    ];
    const users: ManagerUserInput[] = [
      { id: "u-orphan", full_name: "Orphan", email: "o@x.com" },
    ];
    const tree = buildManagerHierarchy(memberships, users);
    expect(tree?.id).toBe("member-u-orphan");
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
