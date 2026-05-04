import { describe, it, expect } from "vitest";
import { pulseSurveySchema, DEFAULT_PULSE_FORM } from "./pulseSurveySchema";

// Default form has empty name/question by design (user must fill them).
// Tests that expect success start from this filled-in baseline.
const VALID_BASE = {
  ...DEFAULT_PULSE_FORM,
  name: "Clima",
  question: "Como você está se sentindo no trabalho?",
};

describe("pulseSurveySchema", () => {
  it("DEFAULT_PULSE_FORM is invalid (empty name/question by design)", () => {
    const result = pulseSurveySchema.safeParse(DEFAULT_PULSE_FORM);
    expect(result.success).toBe(false);
  });

  it("VALID_BASE (default + name + question) is valid", () => {
    const result = pulseSurveySchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = pulseSurveySchema.safeParse({ ...DEFAULT_PULSE_FORM, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("rejects name longer than 80 chars", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      name: "a".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty question", () => {
    const result = pulseSurveySchema.safeParse({ ...DEFAULT_PULSE_FORM, question: "" });
    expect(result.success).toBe(false);
  });

  it("rejects weekly frequency without day_of_week", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      frequency: "weekly",
      day_of_week: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("day_of_week"))).toBe(true);
    }
  });

  it("rejects biweekly frequency without day_of_week", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      frequency: "biweekly",
      day_of_week: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects monthly frequency without day_of_month", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      frequency: "monthly",
      day_of_week: null,
      day_of_month: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("day_of_month"))).toBe(true);
    }
  });

  it("accepts monthly with valid day_of_month", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      frequency: "monthly",
      day_of_week: null,
      day_of_month: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects target_all=false with empty departments and teams", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      target_all: false,
      target_departments: [],
      target_teams: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("target_all"))).toBe(true);
    }
  });

  it("accepts target_all=false with at least 1 department", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      target_all: false,
      target_departments: ["00000000-0000-0000-0000-000000000001"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts target_all=false with at least 1 team", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      target_all: false,
      target_teams: ["00000000-0000-0000-0000-000000000002"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects send_hour_utc out of range", () => {
    const r1 = pulseSurveySchema.safeParse({ ...DEFAULT_PULSE_FORM, send_hour_utc: -1 });
    const r2 = pulseSurveySchema.safeParse({ ...DEFAULT_PULSE_FORM, send_hour_utc: 24 });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("rejects require_comment_below > 10", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      require_comment_below: 11,
    });
    expect(result.success).toBe(false);
  });

  it("accepts mood_emoji question type", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      question_type: "mood_emoji",
    });
    expect(result.success).toBe(true);
  });

  it("accepts enps_0_10 question type", () => {
    const result = pulseSurveySchema.safeParse({
      ...VALID_BASE,
      question_type: "enps_0_10",
    });
    expect(result.success).toBe(true);
  });
});
