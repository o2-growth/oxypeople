import { describe, it, expect } from "vitest";
import {
  ALL_OBJECTIVE_TYPES,
  CANONICAL_OBJECTIVE_TYPES,
  getChildObjectiveType,
  getObjectiveTypeLabel,
  getObjectiveTypeMeta,
  isCanonicalObjectiveType,
  type ObjectiveType,
} from "./objective-types";

describe("objective-types", () => {
  it("ALL_OBJECTIVE_TYPES exposes all six enum values", () => {
    expect(ALL_OBJECTIVE_TYPES).toEqual([
      "strategic",
      "tactical",
      "operational",
      "personal",
      "team",
      "individual",
    ]);
  });

  it("getObjectiveTypeMeta returns metadata for every canonical type", () => {
    for (const type of ALL_OBJECTIVE_TYPES) {
      const meta = getObjectiveTypeMeta(type);
      expect(meta.label).toBeTruthy();
      expect(meta.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(meta.icon).toBeTypeOf("object");
    }
  });

  it("getObjectiveTypeMeta falls back to personal for unknown types", () => {
    const meta = getObjectiveTypeMeta("unknown" as ObjectiveType);
    expect(meta.label).toBe("Pessoal");
  });

  it("getObjectiveTypeLabel returns the PT-BR label", () => {
    expect(getObjectiveTypeLabel("strategic")).toBe("Estratégico");
    expect(getObjectiveTypeLabel("tactical")).toBe("Tático");
    expect(getObjectiveTypeLabel("operational")).toBe("Operacional");
    expect(getObjectiveTypeLabel("personal")).toBe("Pessoal");
    expect(getObjectiveTypeLabel("team")).toBe("Time");
    expect(getObjectiveTypeLabel("individual")).toBe("Individual");
  });

  it("isCanonicalObjectiveType narrows to strategic/tactical/operational", () => {
    expect(isCanonicalObjectiveType("strategic")).toBe(true);
    expect(isCanonicalObjectiveType("tactical")).toBe(true);
    expect(isCanonicalObjectiveType("operational")).toBe(true);
    expect(isCanonicalObjectiveType("personal")).toBe(false);
    expect(isCanonicalObjectiveType("team")).toBe(false);
    expect(isCanonicalObjectiveType("individual")).toBe(false);
  });

  it("CANONICAL_OBJECTIVE_TYPES contains exactly three canonical values", () => {
    expect(CANONICAL_OBJECTIVE_TYPES).toEqual(["strategic", "tactical", "operational"]);
  });

  it("getChildObjectiveType walks the strategic → tactical → operational chain", () => {
    expect(getChildObjectiveType("strategic")).toBe("tactical");
    expect(getChildObjectiveType("tactical")).toBe("operational");
    expect(getChildObjectiveType("operational")).toBeNull();
  });

  it("getChildObjectiveType returns null for non-canonical types", () => {
    expect(getChildObjectiveType("personal")).toBeNull();
    expect(getChildObjectiveType("team")).toBeNull();
    expect(getChildObjectiveType("individual")).toBeNull();
  });
});
