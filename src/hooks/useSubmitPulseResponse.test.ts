import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const toastMock = { success: vi.fn(), error: vi.fn() };
vi.mock("sonner", () => ({ toast: toastMock }));

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const insertResponse = { error: null as { message: string } | null };
const insertMock = vi.fn(() => Promise.resolve(insertResponse));
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string])),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
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
  insertResponse.error = null;
  if (typeof window !== "undefined") window.localStorage.clear();
});

describe("useSubmitPulseResponse — anonymous", () => {
  it("inserts user_id=null and writes localStorage ack", async () => {
    const { useSubmitPulseResponse } = await import("./useSubmitPulseResponse");
    const { result } = renderHook(() => useSubmitPulseResponse(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        pulseSurveyId: "ps1",
        periodStart: "2026-05-04",
        anonymous: true,
        questionType: "scale_1_5",
        score: 4,
      });
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pulse_survey_id: "ps1",
        user_id: null,
        period_start: "2026-05-04",
        score: 4,
      }),
    );
    expect(window.localStorage.getItem("oxypeople:pulse-ack:ps1:2026-05-04")).toBe("1");
    expect(toastMock.success).toHaveBeenCalledWith("Obrigado pelo feedback!");
    expect(trackEventMock).toHaveBeenCalledWith(
      "pulse_response_submitted",
      expect.objectContaining({ anonymous: true, score: 4, question_type: "scale_1_5" }),
    );
  });
});

describe("useSubmitPulseResponse — identified", () => {
  it("inserts user_id=auth.uid()", async () => {
    const { useSubmitPulseResponse } = await import("./useSubmitPulseResponse");
    const { result } = renderHook(() => useSubmitPulseResponse(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        pulseSurveyId: "ps1",
        periodStart: "2026-05-04",
        anonymous: false,
        questionType: "enps_0_10",
        score: 9,
        comment: "  excelente  ",
      });
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        score: 9,
        comment: "excelente",
      }),
    );
    expect(window.localStorage.getItem("oxypeople:pulse-ack:ps1:2026-05-04")).toBeNull();
  });
});

describe("useSubmitPulseResponse — error handling", () => {
  it("releases localStorage ack on error and toasts a friendly message", async () => {
    insertResponse.error = { message: "duplicate key value violates unique constraint" };
    const { useSubmitPulseResponse } = await import("./useSubmitPulseResponse");
    const { result } = renderHook(() => useSubmitPulseResponse(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          pulseSurveyId: "ps1",
          periodStart: "2026-05-04",
          anonymous: true,
          questionType: "mood_emoji",
          score: 5,
          emoji: "😍",
        }),
      ).rejects.toBeDefined();
    });

    expect(window.localStorage.getItem("oxypeople:pulse-ack:ps1:2026-05-04")).toBeNull();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Você já respondeu este Pulse no período corrente.",
    );
  });

  it("generic error toasts the fallback message", async () => {
    insertResponse.error = { message: "network error" };
    const { useSubmitPulseResponse } = await import("./useSubmitPulseResponse");
    const { result } = renderHook(() => useSubmitPulseResponse(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          pulseSurveyId: "ps1",
          periodStart: "2026-05-04",
          anonymous: false,
          questionType: "scale_1_5",
          score: 3,
        }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Não foi possível enviar sua resposta. Tente novamente.",
    );
  });
});
