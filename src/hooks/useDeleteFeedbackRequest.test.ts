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
  delete: ReturnType<typeof vi.fn>;
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
    delete: vi.fn(() => builder),
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
  supabase: { from: (table: string) => fromMock(table) },
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

describe("useDeleteFeedbackRequest", () => {
  it("calls DELETE + tracks event + toasts success", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useDeleteFeedbackRequest } = await import("./useDeleteFeedbackRequest");
    const { result } = renderHook(() => useDeleteFeedbackRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("fr-1");
    });

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "fr-1");
    expect(trackEventMock).toHaveBeenCalledWith("feedback_request_cancelled");
    expect(toastMock.success).toHaveBeenCalledWith("Pedido cancelado");
  });

  it("RLS error toasts permission message", async () => {
    const builder = makeBuilder({
      data: null,
      error: { message: "violates row-level security policy" },
    });
    fromMock.mockImplementation(() => builder);

    const { useDeleteFeedbackRequest } = await import("./useDeleteFeedbackRequest");
    const { result } = renderHook(() => useDeleteFeedbackRequest(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("fr-1")).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Sem permissão. Pedidos respondidos não podem ser cancelados.",
    );
  });
});
