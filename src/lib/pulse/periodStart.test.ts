import { describe, it, expect } from "vitest";
import { periodStartFor, pulseAckKey } from "./periodStart";

describe("periodStartFor — weekly", () => {
  it("when day_of_week=1 (Mon) and now is Wed → snaps to that Monday", () => {
    // Wed 2026-05-06
    const now = new Date("2026-05-06T15:00:00Z");
    expect(periodStartFor(now, "weekly", 1, null)).toBe("2026-05-04");
  });

  it("when day_of_week=1 (Mon) and now IS Mon → snaps to today", () => {
    const now = new Date("2026-05-04T08:00:00Z");
    expect(periodStartFor(now, "weekly", 1, null)).toBe("2026-05-04");
  });

  it("when day_of_week=5 (Fri) and now is Sun → goes back to previous Friday", () => {
    // Sun 2026-05-10
    const now = new Date("2026-05-10T08:00:00Z");
    expect(periodStartFor(now, "weekly", 5, null)).toBe("2026-05-08");
  });

  it("defaults to Monday when day_of_week is null", () => {
    const now = new Date("2026-05-06T08:00:00Z"); // Wed
    expect(periodStartFor(now, "weekly", null, null)).toBe("2026-05-04");
  });
});

describe("periodStartFor — biweekly", () => {
  it("uses createdAt to bucket weeks", () => {
    const created = new Date("2026-01-05T00:00:00Z"); // Mon
    // Same week as created → bucket A
    expect(periodStartFor(new Date("2026-01-07T15:00:00Z"), "biweekly", 1, null, created)).toBe(
      "2026-01-05",
    );
    // Next week (1 week ahead) → bucket B → snaps back 1 week
    expect(periodStartFor(new Date("2026-01-14T15:00:00Z"), "biweekly", 1, null, created)).toBe(
      "2026-01-05",
    );
    // 2 weeks ahead → bucket A again
    expect(periodStartFor(new Date("2026-01-21T15:00:00Z"), "biweekly", 1, null, created)).toBe(
      "2026-01-19",
    );
  });
});

describe("periodStartFor — monthly", () => {
  it("when day_of_month=1 and now is mid-month → snaps to 1st of this month", () => {
    const now = new Date("2026-05-15T15:00:00Z");
    expect(periodStartFor(now, "monthly", null, 1)).toBe("2026-05-01");
  });

  it("when day_of_month=20 and now is the 5th → snaps to 20 of previous month", () => {
    const now = new Date("2026-05-05T15:00:00Z");
    expect(periodStartFor(now, "monthly", null, 20)).toBe("2026-04-20");
  });

  it("clamps day_of_month above 28 to 28 (Feb-safe)", () => {
    const now = new Date("2026-03-30T15:00:00Z");
    expect(periodStartFor(now, "monthly", null, 31)).toBe("2026-03-28");
  });

  it("defaults to day 1 when day_of_month is null", () => {
    const now = new Date("2026-05-15T15:00:00Z");
    expect(periodStartFor(now, "monthly", null, null)).toBe("2026-05-01");
  });
});

describe("pulseAckKey", () => {
  it("produces deterministic keys", () => {
    expect(pulseAckKey("ps-1", "2026-05-04")).toBe("oxypeople:pulse-ack:ps-1:2026-05-04");
  });
});
