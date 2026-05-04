import { z } from "zod";

export const FEEDBACK_VISIBILITY = [
  "private_requester",
  "shared_with_subject",
  "shared_with_manager",
] as const;
export type FeedbackVisibility = (typeof FEEDBACK_VISIBILITY)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .optional()
  .or(z.literal(""));

export const feedbackRequestSchema = z
  .object({
    subject_user_id: z
      .string({ required_error: "Selecione sobre quem é o feedback" })
      .uuid("Pessoa inválida"),
    respondent_id: z
      .string({ required_error: "Selecione quem deve responder" })
      .uuid("Pessoa inválida"),
    question: z
      .string()
      .min(50, "Pergunta precisa de pelo menos 50 caracteres")
      .max(2000, "Máximo 2000 caracteres"),
    competency_tags: z.array(z.string().min(1).max(80)).max(10, "Máximo 10 tags"),
    visibility: z.enum(FEEDBACK_VISIBILITY),
    due_date: isoDate,
  })
  .superRefine((value, ctx) => {
    if (value.due_date && value.due_date.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(`${value.due_date}T00:00:00`);
      if (due.getTime() <= today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["due_date"],
          message: "Prazo precisa ser no futuro",
        });
      }
    }
  });

export type FeedbackRequestFormValues = z.infer<typeof feedbackRequestSchema>;

/**
 * Regras adicionais que precisam do contexto do `requester_id` (auth user)
 * — chamadas no submit antes da mutation.
 */
export function validateRequesterRules(
  values: FeedbackRequestFormValues,
  requesterId: string,
): { ok: true } | { ok: false; field: keyof FeedbackRequestFormValues; message: string } {
  if (values.subject_user_id === requesterId) {
    return {
      ok: false,
      field: "subject_user_id",
      message: "Você não pode pedir feedback sobre você mesmo",
    };
  }
  if (values.respondent_id === requesterId && values.subject_user_id !== requesterId) {
    return {
      ok: false,
      field: "respondent_id",
      message: "Você não pode responder seu próprio pedido sobre outra pessoa",
    };
  }
  return { ok: true };
}

export const feedbackResponseSchema = z.object({
  response: z
    .string()
    .min(50, "Resposta precisa de pelo menos 50 caracteres")
    .max(5000, "Máximo 5000 caracteres"),
});
export type FeedbackResponseValues = z.infer<typeof feedbackResponseSchema>;

export const feedbackDeclineSchema = z.object({
  declined_reason: z
    .string()
    .min(10, "Motivo precisa de pelo menos 10 caracteres")
    .max(500, "Máximo 500 caracteres"),
});
export type FeedbackDeclineValues = z.infer<typeof feedbackDeclineSchema>;

export const DEFAULT_FEEDBACK_FORM: FeedbackRequestFormValues = {
  subject_user_id: "",
  respondent_id: "",
  question: "",
  competency_tags: [],
  visibility: "shared_with_subject",
  due_date: "",
};
