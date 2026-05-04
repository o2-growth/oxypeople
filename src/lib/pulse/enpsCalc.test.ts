import { describe, it, expect } from "vitest";
import { calcEnps, enpsColor } from "./enpsCalc";

describe("calcEnps", () => {
  it("empty array returns zeros", () => {
    const r = calcEnps([]);
    expect(r.total).toBe(0);
    expect(r.enps).toBe(0);
    expect(r.promoters).toBe(0);
  });

  it("[0,5,7,9,10] → 2 detractors, 1 passive, 2 promoters → enps = 0", () => {
    const r = calcEnps([0, 5, 7, 9, 10]);
    expect(r.detractors).toBe(2);
    expect(r.passives).toBe(1);
    expect(r.promoters).toBe(2);
    expect(r.enps).toBe(0);
  });

  it("all promoters → enps = 100", () => {
    const r = calcEnps([9, 10, 9, 10]);
    expect(r.promoters).toBe(4);
    expect(r.enps).toBe(100);
  });

  it("all detractors → enps = -100", () => {
    const r = calcEnps([0, 1, 2, 3, 6]);
    expect(r.detractors).toBe(5);
    expect(r.enps).toBe(-100);
  });

  it("classifies score 6 as detractor (boundary)", () => {
    expect(calcEnps([6]).detractors).toBe(1);
  });

  it("classifies score 7 as passive (boundary)", () => {
    expect(calcEnps([7]).passives).toBe(1);
  });

  it("classifies score 9 as promoter (boundary)", () => {
    expect(calcEnps([9]).promoters).toBe(1);
  });
});

describe("enpsColor", () => {
  it("< 0 = destructive", () => {
    expect(enpsColor(-10)).toBe("destructive");
  });
  it("0..29 = amber", () => {
    expect(enpsColor(0)).toBe("amber");
    expect(enpsColor(29)).toBe("amber");
  });
  it(">= 30 = emerald", () => {
    expect(enpsColor(30)).toBe("emerald");
    expect(enpsColor(80)).toBe("emerald");
  });
});
