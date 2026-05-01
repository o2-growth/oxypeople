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
  __responses?: BuilderResponse[];
  __callIndex?: number;
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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
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

describe("useManagers — list query", () => {
  it("returns members with computed manager_name", async () => {
    const membershipsBuilder = makeBuilder({
      data: [
        {
          id: "m-alice",
          user_id: "user-alice",
          company_id: "company-1",
          department_id: "dept-eng",
          position: "Dev",
          manager_id: "user-bob",
          user: {
            id: "user-alice",
            full_name: "Alice",
            email: "alice@x.com",
            avatar_url: null,
          },
          department: { id: "dept-eng", name: "Engineering" },
        },
        {
          id: "m-bob",
          user_id: "user-bob",
          company_id: "company-1",
          department_id: "dept-eng",
          position: "Lead",
          manager_id: null,
          user: {
            id: "user-bob",
            full_name: "Bob",
            email: "bob@x.com",
            avatar_url: null,
          },
          department: { id: "dept-eng", name: "Engineering" },
        },
      ],
      error: null,
    });

    fromMock.mockImplementation(() => membershipsBuilder);

    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.members).toHaveLength(2);
    const alice = result.current.members.find((m) => m.user_id === "user-alice");
    const bob = result.current.members.find((m) => m.user_id === "user-bob");
    expect(alice?.manager_name).toBe("Bob");
    expect(bob?.manager_name).toBeNull();
    expect(alice?.department_name).toBe("Engineering");
  });

  it("returns [] when companyId is undefined", async () => {
    useUserMock.mockReturnValue({ profile: null });
    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });
    await waitFor(() => expect(result.current.members).toEqual([]));
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("useManagers — setManager", () => {
  it("on success: trackEvent + toast.success", async () => {
    // First call is the list-query (need at least one row so the mutation
    // path runs through normal flow); subsequent calls are the update.
    const listBuilder = makeBuilder({
      data: [
        {
          id: "m-alice",
          user_id: "user-alice",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "user-alice", full_name: "Alice", email: "a@x.com", avatar_url: null },
          department: null,
        },
        {
          id: "m-bob",
          user_id: "user-bob",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "user-bob", full_name: "Bob", email: "b@x.com", avatar_url: null },
          department: null,
        },
      ],
      error: null,
    });
    const updateBuilder = makeBuilder({
      data: { id: "m-alice", manager_id: "user-bob" },
      error: null,
    });

    let callIndex = 0;
    fromMock.mockImplementation(() => {
      callIndex += 1;
      return callIndex === 1 ? listBuilder : updateBuilder;
    });

    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });

    await waitFor(() => expect(result.current.members).toHaveLength(2));

    await act(async () => {
      await result.current.setManager("user-alice", "user-bob");
    });

    expect(updateBuilder.update).toHaveBeenCalledWith({ manager_id: "user-bob" });
    expect(trackEventMock).toHaveBeenCalledWith(
      "manager_assigned",
      expect.objectContaining({ user_id: "user-alice", manager_id: "user-bob" }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Gestor definido");
  });

  it("translates cycle pg error to PT-BR toast with names", async () => {
    const listBuilder = makeBuilder({
      data: [
        {
          id: "m-alice",
          user_id: "user-alice",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "user-alice", full_name: "Alice", email: "a@x.com", avatar_url: null },
          department: null,
        },
        {
          id: "m-bob",
          user_id: "user-bob",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: "user-alice",
          user: { id: "user-bob", full_name: "Bob", email: "b@x.com", avatar_url: null },
          department: null,
        },
      ],
      error: null,
    });
    const updateBuilder = makeBuilder({
      data: null,
      error: { message: "Manager cycle detected: cannot manage your own manager" },
    });

    let callIndex = 0;
    fromMock.mockImplementation(() => {
      callIndex += 1;
      return callIndex === 1 ? listBuilder : updateBuilder;
    });

    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });

    await waitFor(() => expect(result.current.members).toHaveLength(2));

    await act(async () => {
      await expect(result.current.setManager("user-alice", "user-bob")).rejects.toThrow();
    });

    expect(toastMock.error).toHaveBeenCalledWith(
      "Não pode criar ciclo: Alice já é gestor de Bob",
    );
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("unsets manager (managerId=null) → toast 'Gestor removido' + manager_unassigned event", async () => {
    const listBuilder = makeBuilder({
      data: [
        {
          id: "m-alice",
          user_id: "user-alice",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: "user-bob",
          user: { id: "user-alice", full_name: "Alice", email: "a@x.com", avatar_url: null },
          department: null,
        },
      ],
      error: null,
    });
    const updateBuilder = makeBuilder({
      data: { id: "m-alice", manager_id: null },
      error: null,
    });

    let callIndex = 0;
    fromMock.mockImplementation(() => {
      callIndex += 1;
      return callIndex === 1 ? listBuilder : updateBuilder;
    });

    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });

    await waitFor(() => expect(result.current.members).toHaveLength(1));

    await act(async () => {
      await result.current.setManager("user-alice", null);
    });

    expect(updateBuilder.update).toHaveBeenCalledWith({ manager_id: null });
    expect(trackEventMock).toHaveBeenCalledWith(
      "manager_unassigned",
      expect.objectContaining({ user_id: "user-alice" }),
    );
    expect(toastMock.success).toHaveBeenCalledWith("Gestor removido");
  });
});

describe("useManagers — bulkSetManager", () => {
  it("calls update N times for N user ids", async () => {
    const listBuilder = makeBuilder({
      data: [
        {
          id: "m-1",
          user_id: "u-1",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "u-1", full_name: "U1", email: "u1@x.com", avatar_url: null },
          department: null,
        },
        {
          id: "m-2",
          user_id: "u-2",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "u-2", full_name: "U2", email: "u2@x.com", avatar_url: null },
          department: null,
        },
        {
          id: "m-3",
          user_id: "u-3",
          company_id: "company-1",
          department_id: null,
          position: null,
          manager_id: null,
          user: { id: "u-3", full_name: "U3", email: "u3@x.com", avatar_url: null },
          department: null,
        },
      ],
      error: null,
    });
    const updateBuilder = makeBuilder({ data: null, error: null });

    let callIndex = 0;
    fromMock.mockImplementation(() => {
      callIndex += 1;
      return callIndex === 1 ? listBuilder : updateBuilder;
    });

    const { useManagers } = await import("./useManagers");
    const { result } = renderHook(() => useManagers(), { wrapper });

    await waitFor(() => expect(result.current.members).toHaveLength(3));

    await act(async () => {
      await result.current.bulkSetManager(["u-1", "u-2", "u-3"], "u-mgr");
    });

    // 1 update call per userId (3 calls total)
    expect(updateBuilder.update).toHaveBeenCalledTimes(3);
    expect(updateBuilder.update).toHaveBeenCalledWith({ manager_id: "u-mgr" });
    expect(toastMock.success).toHaveBeenCalledWith("3 pessoa(s) atualizada(s)");
  });
});
