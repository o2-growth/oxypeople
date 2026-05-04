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

describe("useDeclineFeedback", () => {
  it("UPDATE com status=declined + declined_reason + tracks event", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useDeclineFeedback } = await import("./useDeclineFeedback");
    const { result } = renderHook(() => useDeclineFeedback(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "fr-1",
        declined_reason: "Não trabalhei diretamente com essa pessoa neste período.",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });
    });

    const updateArg = builder.update.mock.calls[0][0];
    expect(updateArg.status).toBe("declined");
    expect(updateArg.declined_reason).toContain("Não trabalhei");
    expect(builder.eq).toHaveBeenCalledWith("id", "fr-1");
    expect(trackEventMock).toHaveBeenCalledWith(
      "feedback_response_declined",
      expect.objectContaining({
        time_to_decline_hours: expect.any(Number),
        reason_length: expect.any(Number),
      }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Pedido recusado");
  });
});
