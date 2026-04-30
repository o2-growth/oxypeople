import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOkrEscalation", () => {
  it("on success=true: toast.success with notification count and trackEvent payload", async () => {
    const report = {
      totalCompanies: 2,
      totalObjectivesScanned: 10,
      totalAtRisk: 3,
      totalNotificationsCreated: 5,
      durationMs: 1234,
      perCompany: [],
    };
    invokeMock.mockResolvedValueOnce({
      data: { success: true, data: report },
      error: null,
    });

    const { useOkrEscalation } = await import("./useOkrEscalation");
    const { result } = renderHook(() => useOkrEscalation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledWith("okr-escalation", {});
    expect(toastMock.success).toHaveBeenCalledWith(
      "Escalação executada — 5 notificações criadas",
    );
    expect(trackEventMock).toHaveBeenCalledWith("okr_escalation_manual_run", {
      success: true,
      notifications_created: 5,
      at_risk: 3,
      duration_ms: 1234,
    });
  });

  it("on success=false: toast.warning instead of success", async () => {
    const report = {
      totalCompanies: 1,
      totalObjectivesScanned: 4,
      totalAtRisk: 1,
      totalNotificationsCreated: 0,
      durationMs: 500,
      perCompany: [],
    };
    invokeMock.mockResolvedValueOnce({
      data: { success: false, data: report, errors: ["x"] },
      error: null,
    });

    const { useOkrEscalation } = await import("./useOkrEscalation");
    const { result } = renderHook(() => useOkrEscalation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    await waitFor(() => expect(toastMock.warning).toHaveBeenCalledTimes(1));
    expect(toastMock.warning).toHaveBeenCalledWith(
      "Escalação completada com erros — veja relatório",
    );
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(trackEventMock).toHaveBeenCalledWith(
      "okr_escalation_manual_run",
      expect.objectContaining({ success: false, notifications_created: 0, at_risk: 1 }),
    );
  });

  it("on invoke error: toast.error with the message", async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: new Error("network down"),
    });

    const { useOkrEscalation } = await import("./useOkrEscalation");
    const { result } = renderHook(() => useOkrEscalation(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeDefined();
    });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledTimes(1));
    expect(toastMock.error).toHaveBeenCalledWith("Falha ao executar: network down");
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("on empty data response: throws 'Edge function retornou resposta vazia.'", async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { useOkrEscalation } = await import("./useOkrEscalation");
    const { result } = renderHook(() => useOkrEscalation(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        "Edge function retornou resposta vazia.",
      );
    });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledTimes(1));
    expect(toastMock.error).toHaveBeenCalledWith(
      "Falha ao executar: Edge function retornou resposta vazia.",
    );
  });
});
