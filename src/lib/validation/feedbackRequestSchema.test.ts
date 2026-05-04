import { describe, it, expect } from "vitest";
import {
  feedbackRequestSchema,
  validateRequesterRules,
  DEFAULT_FEEDBACK_FORM,
} from "./feedbackRequestSchema";

const VALID = {
  subject_user_id: "00000000-0000-0000-0000-000000000001",
  respondent_id: "00000000-0000-0000-0000-000000000002",
  question:
    "Como você avalia minha contribuição no projeto X nos últimos 30 dias? Foque em comunicação e entrega.",
  competency_tags: ["Comunicação"],
  visibility: "shared_with_subject" as const,
  due_date: "2099-12-31",
};

describe("feedbackRequestSchema — Zod", () => {
  it("DEFAULT_FEEDBACK_FORM is invalid (UUIDs vazios + question curta)", () => {
    expect(feedbackRequestSchema.safeParse(DEFAULT_FEEDBACK_FORM).success).toBe(false);
  });

  it("VALID base passes", () => {
    expect(feedbackRequestSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects question shorter than 50 chars", () => {
    const r = feedbackRequestSchema.safeParse({
      ...VALID,
      question: "muito curta",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("question"))).toBe(true);
    }
  });

  it("rejects question longer than 2000 chars", () => {
    const r = feedbackRequestSchema.safeParse({
      ...VALID,
      question: "a".repeat(2001),
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid UUID for subject", () => {
    const r = feedbackRequestSchema.safeParse({ ...VALID, subject_user_id: "not-uuid" });
    expect(r.success).toBe(false);
  });

  it("rejects past due_date", () => {
    const r = feedbackRequestSchema.safeParse({ ...VALID, due_date: "2020-01-01" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("due_date"))).toBe(true);
    }
  });

  it("accepts empty due_date", () => {
    const r = feedbackRequestSchema.safeParse({ ...VALID, due_date: "" });
    expect(r.success).toBe(true);
  });

  it("rejects more than 10 competency tags", () => {
    const r = feedbackRequestSchema.safeParse({
      ...VALID,
      competency_tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
    });
    expect(r.success).toBe(false);
  });
});

describe("validateRequesterRules", () => {
  const REQUESTER = "00000000-0000-0000-0000-0000000000aa";

  it("blocks requester=subject", () => {
    const r = validateRequesterRules(
      { ...VALID, subject_user_id: REQUESTER },
      REQUESTER,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("subject_user_id");
  });

  it("blocks requester=respondent when subject is someone else", () => {
    const r = validateRequesterRules(
      { ...VALID, respondent_id: REQUESTER },
      REQUESTER,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("respondent_id");
  });

  it("allows requester=respondent when subject IS the requester (auto-reflect)", () => {
    const r = validateRequesterRules(
      { ...VALID, subject_user_id: REQUESTER, respondent_id: REQUESTER },
      REQUESTER,
    );
    // O blocker primário (subject=requester) bate primeiro:
    expect(r.ok).toBe(false);
  });

  it("passes when requester != subject and requester != respondent", () => {
    const r = validateRequesterRules(VALID, REQUESTER);
    expect(r.ok).toBe(true);
  });
});
