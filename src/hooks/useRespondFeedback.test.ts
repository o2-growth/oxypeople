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

type BuilderResponse = { data: unknown; error: unknown };

interface ChainableBuilder {
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled: (value: BuilderResponse) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
  __resolve: BuilderResponse;
}

function makeBuilder(initial: BuilderResponse = { data: null, error: null }): ChainableBuilder {
  const builder = {
    __resolve: initial,
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    then: (
      onFulfilled: (value: BuilderResponse) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(builder.__resolve).then(onFulfilled, onRejected),
  } as ChainableBuilder;
  return builder;
}

const fromMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRespondFeedback", () => {
  it("UPDATE com status=answered + answered_at + tracks PostHog", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useRespondFeedback } = await import("./useRespondFeedback");
    const { result } = renderHook(() => useRespondFeedback(), { wrapper });

    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h atrás
    await act(async () => {
      await result.current.mutateAsync({
        id: "fr-1",
        response: "Resposta longa o suficiente para passar pela validação Zod de 50 caracteres.",
        visibility: "shared_with_subject",
        createdAt,
      });
    });

    const updateArg = builder.update.mock.calls[0][0];
    expect(updateArg.status).toBe("answered");
    expect(updateArg.response).toContain("Resposta longa");
    expect(typeof updateArg.answered_at).toBe("string");
    expect(builder.eq).toHaveBeenCalledWith("id", "fr-1");
    expect(trackEventMock).toHaveBeenCalledWith(
      "feedback_response_submitted",
      expect.objectContaining({
        visibility: "shared_with_subject",
        char_count: expect.any(Number),
        time_to_respond_hours: expect.any(Number),
      }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Resposta enviada");
  });

  it("RLS error toasts permission message", async () => {
    const builder = makeBuilder({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });
    fromMock.mockImplementation(() => builder);

    const { useRespondFeedback } = await import("./useRespondFeedback");
    const { result } = renderHook(() => useRespondFeedback(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "fr-1",
          response: "x".repeat(60),
          visibility: "private_requester",
          createdAt: new Date().toISOString(),
        }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith("Sem permissão para responder este pedido.");
  });
});
