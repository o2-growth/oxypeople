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
});

describe("useObjectiveCollaborators — list query", () => {
  it("filters by objectiveId and maps rows to ObjectiveCollaborator", async () => {
    const builder = makeBuilder({
      data: [
        {
          id: "c1",
          user_id: "u1",
          role: "editor",
          user: { id: "u1", full_name: "Alice", email: "a@x.com", avatar_url: null },
        },
      ],
      error: null,
    });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveCollaborators } = await import("./useObjectiveCollaborators");
    const { result } = renderHook(() => useObjectiveCollaborators("obj-1"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fromMock).toHaveBeenCalledWith("objective_collaborators");
    expect(builder.eq).toHaveBeenCalledWith("objective_id", "obj-1");
    expect(result.current.collaborators).toHaveLength(1);
    expect(result.current.collaborators[0]).toMatchObject({
      id: "c1",
      user_id: "u1",
      role: "editor",
    });
  });

  it("returns [] when objectiveId is undefined (query disabled)", async () => {
    const { useObjectiveCollaborators } = await import("./useObjectiveCollaborators");
    const { result } = renderHook(() => useObjectiveCollaborators(undefined), { wrapper });

    await waitFor(() => expect(result.current.collaborators).toEqual([]));
    // The query is disabled, so .from should never be called for the list.
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("useObjectiveCollaborators — addCollaborator", () => {
  it("inserts with the right shape and toasts success", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveCollaborators } = await import("./useObjectiveCollaborators");
    const { result } = renderHook(() => useObjectiveCollaborators("obj-1"), { wrapper });

    await act(async () => {
      await result.current.addCollaborator.mutateAsync({ userId: "u-2", role: "contributor" });
    });

    expect(builder.insert).toHaveBeenCalledWith({
      objective_id: "obj-1",
      user_id: "u-2",
      role: "contributor",
    });
    expect(toastMock.success).toHaveBeenCalledWith("Colaborador adicionado");
    expect(trackEventMock).toHaveBeenCalledWith("objective_collaborator_added", {
      objective_id: "obj-1",
      role: "contributor",
    });
  });
});

describe("useObjectiveCollaborators — updateCollaboratorRole", () => {
  it("patches role and toasts the new role label", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveCollaborators } = await import("./useObjectiveCollaborators");
    const { result } = renderHook(() => useObjectiveCollaborators("obj-1"), { wrapper });

    await act(async () => {
      await result.current.updateCollaboratorRole.mutateAsync({
        collaboratorId: "c1",
        role: "editor",
      });
    });

    expect(builder.update).toHaveBeenCalledWith({ role: "editor" });
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(toastMock.success).toHaveBeenCalledWith("Papel atualizado para Editor");
    expect(trackEventMock).toHaveBeenCalledWith("objective_collaborator_role_changed", {
      objective_id: "obj-1",
      role: "editor",
    });
  });
});

describe("useObjectiveCollaborators — removeCollaborator", () => {
  it("deletes by id and toasts removal", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveCollaborators } = await import("./useObjectiveCollaborators");
    const { result } = renderHook(() => useObjectiveCollaborators("obj-1"), { wrapper });

    await act(async () => {
      await result.current.removeCollaborator.mutateAsync("c1");
    });

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(toastMock.success).toHaveBeenCalledWith("Colaborador removido");
    expect(trackEventMock).toHaveBeenCalledWith("objective_collaborator_removed", {
      objective_id: "obj-1",
    });
  });
});
