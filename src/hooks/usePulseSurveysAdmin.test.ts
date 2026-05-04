import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { DEFAULT_PULSE_FORM } from "@/lib/validation/pulseSurveySchema";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const useUserMock = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  useUser: () => useUserMock(),
}));

type BuilderResponse = { data: unknown; error: unknown };

interface ChainableBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (
    onFulfilled: (value: BuilderResponse) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
  __resolve: BuilderResponse;
}

function makeBuilder(initial: BuilderResponse = { data: null, error: null }): ChainableBuilder {
  const builder = {
    __resolve: initial,
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(builder.__resolve)),
    then: (
      onFulfilled: (value: BuilderResponse) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(builder.__resolve).then(onFulfilled, onRejected),
  } as ChainableBuilder;
  return builder;
}

const fromMock = vi.fn();
const getUserMock = vi.fn(() =>
  Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    auth: {
      getUser: () => getUserMock(),
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
  useUserMock.mockReturnValue({ profile: { primary_company_id: "company-1" } });
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

describe("usePulseSurveysAdmin — list query", () => {
  it("fetches pulse_surveys for the company and joins response counts", async () => {
    const surveysBuilder = makeBuilder({
      data: [
        {
          id: "ps1",
          company_id: "company-1",
          created_by: "user-1",
          name: "Clima",
          question: "Como você está?",
          question_type: "scale_1_5",
          frequency: "weekly",
          day_of_week: 1,
          day_of_month: null,
          send_hour_utc: 12,
          target_departments: [],
          target_teams: [],
          target_all: true,
          active: true,
          require_comment_below: 2,
          anonymous: false,
          last_dispatched_at: null,
          created_at: "x",
          updated_at: "x",
        },
      ],
      error: null,
    });
    const responsesBuilder = makeBuilder({
      data: [
        { pulse_survey_id: "ps1", period_start: "2025-01-01" },
        { pulse_survey_id: "ps1", period_start: "2025-02-01" },
      ],
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "pulse_surveys") return surveysBuilder;
      if (table === "pulse_responses") return responsesBuilder;
      return makeBuilder();
    });

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pulseSurveys).toHaveLength(1);
    expect(result.current.pulseSurveys[0]).toMatchObject({
      id: "ps1",
      has_responses: true,
    });
    expect(surveysBuilder.eq).toHaveBeenCalledWith("company_id", "company-1");
    expect(surveysBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(responsesBuilder.in).toHaveBeenCalledWith("pulse_survey_id", ["ps1"]);
  });

  it("returns [] when companyId is undefined", async () => {
    useUserMock.mockReturnValue({ profile: null });

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await waitFor(() => expect(result.current.pulseSurveys).toEqual([]));
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("usePulseSurveysAdmin — createPulse", () => {
  it("inserts with company_id, created_by and PostHog event includes shape", async () => {
    const surveysBuilder = makeBuilder({
      data: { id: "new-1" },
      error: null,
    });
    fromMock.mockImplementation(() => surveysBuilder);

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await result.current.createPulse.mutateAsync({
        ...DEFAULT_PULSE_FORM,
        name: "Clima",
        question: "Como você está?",
      });
    });

    expect(surveysBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        created_by: "user-1",
        name: "Clima",
        question: "Como você está?",
        active: true,
      }),
    );
    expect(trackEventMock).toHaveBeenCalledWith(
      "pulse_survey_created",
      expect.objectContaining({
        frequency: "weekly",
        question_type: "scale_1_5",
        anonymous: false,
      }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Pesquisa Pulse criada");
  });

  it("for mood_emoji forces require_comment_below to null", async () => {
    const surveysBuilder = makeBuilder({ data: { id: "new-1" }, error: null });
    fromMock.mockImplementation(() => surveysBuilder);

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await result.current.createPulse.mutateAsync({
        ...DEFAULT_PULSE_FORM,
        name: "Mood",
        question: "Como você está?",
        question_type: "mood_emoji",
        require_comment_below: 3,
      });
    });

    expect(surveysBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ require_comment_below: null }),
    );
  });

  it("toasts error when company is missing", async () => {
    useUserMock.mockReturnValue({ profile: null });
    fromMock.mockImplementation(() => makeBuilder({ data: null, error: null }));

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await expect(
        result.current.createPulse.mutateAsync({
          ...DEFAULT_PULSE_FORM,
          name: "x",
          question: "y",
        }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalled();
    expect(trackEventMock).not.toHaveBeenCalled();
  });
});

describe("usePulseSurveysAdmin — togglePulse", () => {
  it("on activate: tracks event with active=true and toasts ativada", async () => {
    const surveysBuilder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => surveysBuilder);

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await result.current.togglePulse.mutateAsync({ id: "ps1", active: true });
    });

    expect(surveysBuilder.update).toHaveBeenCalledWith({ active: true });
    expect(surveysBuilder.eq).toHaveBeenCalledWith("id", "ps1");
    expect(trackEventMock).toHaveBeenCalledWith("pulse_survey_toggled", { active: true });
    expect(toastMock.success).toHaveBeenCalledWith("Pesquisa ativada");
  });

  it("on deactivate: toasts pausada", async () => {
    const surveysBuilder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => surveysBuilder);

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await result.current.togglePulse.mutateAsync({ id: "ps1", active: false });
    });

    expect(toastMock.success).toHaveBeenCalledWith("Pesquisa pausada");
  });
});

describe("usePulseSurveysAdmin — deletePulse", () => {
  it("on success: tracks pulse_survey_deleted + toasts removida", async () => {
    const surveysBuilder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => surveysBuilder);

    const { usePulseSurveysAdmin } = await import("./usePulseSurveysAdmin");
    const { result } = renderHook(() => usePulseSurveysAdmin(), { wrapper });

    await act(async () => {
      await result.current.deletePulse.mutateAsync("ps1");
    });

    expect(surveysBuilder.delete).toHaveBeenCalled();
    expect(surveysBuilder.eq).toHaveBeenCalledWith("id", "ps1");
    expect(trackEventMock).toHaveBeenCalledWith("pulse_survey_deleted");
    expect(toastMock.success).toHaveBeenCalledWith("Pesquisa removida");
  });
});
