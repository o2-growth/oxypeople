import { describe, it, expect } from "vitest";
import { performanceBucket, nineBoxCellName } from "./performanceBucket";

describe("performanceBucket", () => {
  it("score < 6.0 → 1 (baixo)", () => {
    expect(performanceBucket(0)).toBe(1);
    expect(performanceBucket(5.99)).toBe(1);
  });

  it("6.0 ≤ score < 8.0 → 2 (médio)", () => {
    expect(performanceBucket(6.0)).toBe(2);
    expect(performanceBucket(7.5)).toBe(2);
    expect(performanceBucket(7.99)).toBe(2);
  });

  it("score ≥ 8.0 → 3 (alto)", () => {
    expect(performanceBucket(8.0)).toBe(3);
    expect(performanceBucket(10)).toBe(3);
  });

  it("null / undefined / NaN → 2 (neutro)", () => {
    expect(performanceBucket(null)).toBe(2);
    expect(performanceBucket(undefined)).toBe(2);
    expect(performanceBucket(NaN)).toBe(2);
  });
});

describe("nineBoxCellName", () => {
  it("(3,3) = Estrela", () => {
    expect(nineBoxCellName(3, 3)).toBe("Estrela");
  });

  it("(1,1) = Risco", () => {
    expect(nineBoxCellName(1, 1)).toBe("Risco");
  });

  it("(2,2) = Mantenedor", () => {
    expect(nineBoxCellName(2, 2)).toBe("Mantenedor");
  });

  it("(3,2) = Alto Potencial", () => {
    expect(nineBoxCellName(3, 2)).toBe("Alto Potencial");
  });

  it("(1,3) = Enigma", () => {
    expect(nineBoxCellName(1, 3)).toBe("Enigma");
  });

  it("eixo inválido retorna '—'", () => {
    expect(nineBoxCellName(0, 0)).toBe("—");
  });
});
