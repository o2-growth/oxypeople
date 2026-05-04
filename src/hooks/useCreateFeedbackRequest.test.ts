import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const toastMock = { success: vi.fn(), error: vi.fn() };
vi.mock("sonner", () => ({ toast: toastMock }));

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const useUserMock = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  useUser: () => useUserMock(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

type BuilderResponse = { data: unknown; error: unknown };

interface ChainableBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  __resolve: BuilderResponse;
}

function makeBuilder(initial: BuilderResponse = { data: null, error: null }): ChainableBuilder {
  const builder = {
    __resolve: initial,
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(builder.__resolve)),
  } as ChainableBuilder;
  return builder;
}

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
    },
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return createElement(QueryClientProvider, { client }, children);
}

const VALID_INPUT = {
  subject_user_id: "00000000-0000-0000-0000-000000000aa1",
  respondent_id: "00000000-0000-0000-0000-000000000aa2",
  question:
    "Como você avalia minha contribuição no projeto X nos últimos 30 dias? Foque em comunicação.",
  competency_tags: ["Comunicação"],
  visibility: "shared_with_subject" as const,
  due_date: "2099-12-31",
};

beforeEach(() => {
  vi.clearAllMocks();
  useUserMock.mockReturnValue({ profile: { primary_company_id: "company-1" } });
});

describe("useCreateFeedbackRequest", () => {
  it("inserts with company_id + requester_id + tracks event", async () => {
    const builder = makeBuilder({ data: { id: "fr-1" }, error: null });
    fromMock.mockImplementation(() => builder);

    const { useCreateFeedbackRequest } = await import("./useCreateFeedbackRequest");
    const { result } = renderHook(() => useCreateFeedbackRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(VALID_INPUT);
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        requester_id: "user-1",
        respondent_id: VALID_INPUT.respondent_id,
        subject_user_id: VALID_INPUT.subject_user_id,
        visibility: "shared_with_subject",
      }),
    );
    expect(trackEventMock).toHaveBeenCalledWith(
      "feedback_request_sent",
      expect.objectContaining({
        visibility: "shared_with_subject",
        has_competency_tags: true,
        has_due_date: true,
      }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Pedido de feedback enviado");
  });

  it("translates feedback_requester_not_respondent constraint", async () => {
    const builder = makeBuilder({
      data: null,
      error: { message: 'violates check constraint "feedback_requester_not_respondent"' },
    });
    fromMock.mockImplementation(() => builder);

    const { useCreateFeedbackRequest } = await import("./useCreateFeedbackRequest");
    const { result } = renderHook(() => useCreateFeedbackRequest(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(VALID_INPUT)).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Você não pode responder seu próprio pedido sobre outra pessoa.",
    );
  });

  it("translates RLS error as permission message", async () => {
    const builder = makeBuilder({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });
    fromMock.mockImplementation(() => builder);

    const { useCreateFeedbackRequest } = await import("./useCreateFeedbackRequest");
    const { result } = renderHook(() => useCreateFeedbackRequest(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(VALID_INPUT)).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Sem permissão. Confirme se todos pertencem à empresa.",
    );
  });

  it("converts empty due_date to null", async () => {
    const builder = makeBuilder({ data: { id: "fr-1" }, error: null });
    fromMock.mockImplementation(() => builder);

    const { useCreateFeedbackRequest } = await import("./useCreateFeedbackRequest");
    const { result } = renderHook(() => useCreateFeedbackRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...VALID_INPUT, due_date: "" });
    });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ due_date: null }),
    );
  });
});
