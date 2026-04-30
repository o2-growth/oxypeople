import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Mocks (must be set up before importing the hook under test)
// ---------------------------------------------------------------------------

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

const useUserMock = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  useUser: () => useUserMock(),
}));

// Builder mock for the supabase chainable client. Each test case sets up the
// terminal return values via configureFromHandler / configureSingleResponse.
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

// fromMock will be configured per-test to return the appropriate builder for
// each table. We expose the helper `setFromHandler` to swap behavior.
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
  },
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

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
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePeriodsAdmin — list query", () => {
  it("returns periods sorted by start_date desc with objective_count populated", async () => {
    const periodsBuilder = makeBuilder({
      data: [
        { id: "p1", name: "Q1", start_date: "2026-01-01", end_date: "2026-03-31", created_at: "x", updated_at: "x" },
        { id: "p2", name: "Q2", start_date: "2025-10-01", end_date: "2025-12-31", created_at: "x", updated_at: "x" },
      ],
      error: null,
    });
    const objectivesBuilder = makeBuilder({
      data: [
        { period_id: "p1" },
        { period_id: "p1" },
        { period_id: "p2" },
        { period_id: null },
      ],
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "periods") return periodsBuilder;
      if (table === "objectives") return objectivesBuilder;
      return makeBuilder();
    });

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.periods).toHaveLength(2);
    expect(result.current.periods[0]).toMatchObject({ id: "p1", objective_count: 2 });
    expect(result.current.periods[1]).toMatchObject({ id: "p2", objective_count: 1 });
    // Confirm the order().asc=false call site receives start_date desc
    expect(periodsBuilder.order).toHaveBeenCalledWith("start_date", { ascending: false });
    expect(periodsBuilder.eq).toHaveBeenCalledWith("company_id", "company-1");
    expect(objectivesBuilder.in).toHaveBeenCalledWith("period_id", ["p1", "p2"]);
  });

  it("returns [] when companyId is undefined", async () => {
    useUserMock.mockReturnValue({ profile: null });

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    // Query is disabled — no fetch should happen and periods stays []
    await waitFor(() => expect(result.current.periods).toEqual([]));
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("usePeriodsAdmin — createPeriod", () => {
  it("on success: trackEvent + toast.success + cache invalidated", async () => {
    const periodsBuilder = makeBuilder({
      data: { id: "new-1", name: "Q3", start_date: "2026-07-01", end_date: "2026-09-30" },
      error: null,
    });
    fromMock.mockImplementation((table: string) => {
      if (table === "periods") return periodsBuilder;
      return makeBuilder();
    });

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await result.current.createPeriod.mutateAsync({
        name: "Q3",
        start_date: "2026-07-01",
        end_date: "2026-09-30",
      });
    });

    expect(periodsBuilder.insert).toHaveBeenCalledWith({
      company_id: "company-1",
      name: "Q3",
      start_date: "2026-07-01",
      end_date: "2026-09-30",
    });
    expect(trackEventMock).toHaveBeenCalledWith("period_created");
    expect(toastMock.success).toHaveBeenCalledWith("Período criado");
  });

  it("translates overlap pg error to PT-BR toast", async () => {
    const periodsBuilder = makeBuilder({
      data: null,
      error: { message: "dates overlap with existing period" },
    });
    fromMock.mockImplementation(() => periodsBuilder);

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await expect(
        result.current.createPeriod.mutateAsync({
          name: "Bad",
          start_date: "2026-07-01",
          end_date: "2026-09-30",
        }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith("Período sobrepõe outro período existente.");
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("translates start_date >= end_date pg error to PT-BR toast", async () => {
    const periodsBuilder = makeBuilder({
      data: null,
      error: { message: "start_date must be before end_date" },
    });
    fromMock.mockImplementation(() => periodsBuilder);

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await expect(
        result.current.createPeriod.mutateAsync({
          name: "Bad",
          start_date: "2026-09-30",
          end_date: "2026-07-01",
        }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Data inicial precisa ser anterior à data final.",
    );
  });
});

describe("usePeriodsAdmin — updatePeriod", () => {
  it("uses the right id and select pattern", async () => {
    const periodsBuilder = makeBuilder({
      data: { id: "p1", name: "Q1 v2", start_date: "2026-01-01", end_date: "2026-03-31" },
      error: null,
    });
    fromMock.mockImplementation(() => periodsBuilder);

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await result.current.updatePeriod.mutateAsync({
        id: "p1",
        name: "Q1 v2",
        start_date: "2026-01-01",
        end_date: "2026-03-31",
      });
    });

    expect(periodsBuilder.update).toHaveBeenCalledWith({
      name: "Q1 v2",
      start_date: "2026-01-01",
      end_date: "2026-03-31",
    });
    expect(periodsBuilder.eq).toHaveBeenCalledWith("id", "p1");
    expect(periodsBuilder.select).toHaveBeenCalled();
    expect(periodsBuilder.single).toHaveBeenCalled();
    expect(trackEventMock).toHaveBeenCalledWith("period_updated");
    expect(toastMock.success).toHaveBeenCalledWith("Período atualizado");
  });
});

describe("usePeriodsAdmin — deletePeriod", () => {
  it("on FK violation toasts the unlink message", async () => {
    const periodsBuilder = makeBuilder({
      data: null,
      error: { message: 'update or delete on table "periods" violates foreign key constraint' },
    });
    fromMock.mockImplementation(() => periodsBuilder);

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await expect(result.current.deletePeriod.mutateAsync("p1")).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Período tem objetivos vinculados — desvincule antes de remover.",
    );
  });

  it("on success toasts removal and tracks event", async () => {
    const periodsBuilder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => periodsBuilder);

    const { usePeriodsAdmin } = await import("./usePeriodsAdmin");
    const { result } = renderHook(() => usePeriodsAdmin(), { wrapper });

    await act(async () => {
      await result.current.deletePeriod.mutateAsync("p1");
    });

    expect(periodsBuilder.delete).toHaveBeenCalled();
    expect(periodsBuilder.eq).toHaveBeenCalledWith("id", "p1");
    expect(trackEventMock).toHaveBeenCalledWith("period_deleted");
    expect(toastMock.success).toHaveBeenCalledWith("Período removido");
  });
});
