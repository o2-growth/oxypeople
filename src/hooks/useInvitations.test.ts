import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};
vi.mock("sonner", () => ({ toast: toastMock }));

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
  maybeSingle: ReturnType<typeof vi.fn>;
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
    maybeSingle: vi.fn(() => Promise.resolve(builder.__resolve)),
    then: (
      onFulfilled: (value: BuilderResponse) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(builder.__resolve).then(onFulfilled, onRejected),
  } as ChainableBuilder;
  return builder;
}

const fromMock = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
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
  useUserMock.mockReturnValue({ profile: { primary_company_id: "company-1" } });
});

// ---------------------------------------------------------------------------
// pendingInvites query
// ---------------------------------------------------------------------------

describe("useInvitations — pendingInvites query", () => {
  it("filters by company_id + status='invited' and maps the response", async () => {
    const builder = makeBuilder({
      data: [
        {
          id: "m1",
          position: "Designer",
          department_id: "d1",
          invited_by: "admin-1",
          created_at: "2026-04-01T10:00:00Z",
          user: { email: "alice@o2.com" },
          department: { name: "Produto" },
        },
        {
          id: "m2",
          position: null,
          department_id: null,
          invited_by: null,
          created_at: "2026-03-30T09:00:00Z",
          user: { email: "bob@o2.com" },
          department: null,
        },
      ],
      error: null,
    });
    fromMock.mockImplementation(() => builder);

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fromMock).toHaveBeenCalledWith("company_memberships");
    expect(builder.eq).toHaveBeenCalledWith("company_id", "company-1");
    expect(builder.eq).toHaveBeenCalledWith("status", "invited");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result.current.pendingInvites).toHaveLength(2);
    expect(result.current.pendingInvites[0]).toMatchObject({
      id: "m1",
      email: "alice@o2.com",
      position: "Designer",
      department_name: "Produto",
    });
    expect(result.current.pendingInvites[1]).toMatchObject({
      id: "m2",
      email: "bob@o2.com",
      position: null,
      department_name: null,
    });
  });

  it("returns [] when companyId is undefined and never queries", async () => {
    useUserMock.mockReturnValue({ profile: null });

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await waitFor(() => expect(result.current.pendingInvites).toEqual([]));
    expect(fromMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// inviteUser
// ---------------------------------------------------------------------------

describe("useInvitations — inviteUser", () => {
  it("invokes invite-user edge function, toasts success and tracks event", async () => {
    const listBuilder = makeBuilder({ data: [], error: null });
    fromMock.mockImplementation(() => listBuilder);
    invokeMock.mockResolvedValueOnce({
      data: { success: true, membershipId: "mem-1", userId: "u-1", emailSent: false },
      error: null,
    });

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await act(async () => {
      await result.current.inviteUser.mutateAsync({
        email: "  NEW@o2.com ",
        position: " PM ",
        departmentId: "d1",
      });
    });

    expect(invokeMock).toHaveBeenCalledWith("invite-user", {
      body: {
        email: "new@o2.com",
        position: "PM",
        departmentId: "d1",
        companyId: "company-1",
      },
    });
    expect(toastMock.success).toHaveBeenCalledWith("Convite enviado para   NEW@o2.com ");
    expect(trackEventMock).toHaveBeenCalledWith("invitation_sent", {
      email_sent: false,
      had_position: true,
      had_department: true,
    });
  });

  it("on success=false from edge function: toast.error with returned message", async () => {
    fromMock.mockImplementation(() => makeBuilder({ data: [], error: null }));
    invokeMock.mockResolvedValueOnce({
      data: { success: false, error: "Apenas admins podem convidar usuários" },
      error: null,
    });

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await act(async () => {
      await expect(
        result.current.inviteUser.mutateAsync({ email: "x@o2.com" }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Falha ao convidar: Apenas admins podem convidar usuários",
    );
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("on invoke transport error: toast.error with the message", async () => {
    fromMock.mockImplementation(() => makeBuilder({ data: [], error: null }));
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error("network down") });

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await act(async () => {
      await expect(
        result.current.inviteUser.mutateAsync({ email: "x@o2.com" }),
      ).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith("Falha ao convidar: network down");
  });
});

// ---------------------------------------------------------------------------
// cancelInvite
// ---------------------------------------------------------------------------

describe("useInvitations — cancelInvite", () => {
  it("deletes by membership id with status='invited' guard", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await act(async () => {
      await result.current.cancelInvite.mutateAsync("mem-9");
    });

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "mem-9");
    expect(builder.eq).toHaveBeenCalledWith("status", "invited");
    expect(toastMock.success).toHaveBeenCalledWith("Convite cancelado");
    expect(trackEventMock).toHaveBeenCalledWith("invitation_cancelled");
  });

  it("on db error: toast.error", async () => {
    const builder = makeBuilder({ data: null, error: { message: "permission denied" } });
    fromMock.mockImplementation(() => builder);

    const { useInvitations } = await import("./useInvitations");
    const { result } = renderHook(() => useInvitations(), { wrapper });

    await act(async () => {
      await expect(result.current.cancelInvite.mutateAsync("mem-9")).rejects.toBeDefined();
    });

    expect(toastMock.error).toHaveBeenCalledWith("Falha ao cancelar: permission denied");
  });
});
