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
const channelMock = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    channel: vi.fn(() => channelMock),
    removeChannel: vi.fn(),
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
  channelMock.on.mockReturnThis();
  channelMock.subscribe.mockReturnThis();
});

describe("useObjectiveComments — list query", () => {
  it("filters by objectiveId, orders by created_at, and maps rows", async () => {
    const builder = makeBuilder({
      data: [
        {
          id: "c1",
          objective_id: "obj-1",
          key_result_id: null,
          parent_comment_id: null,
          author_id: "u1",
          content: "Hello",
          edited_at: null,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          author: { id: "u1", full_name: "Alice", email: "a@x.com", avatar_url: null },
        },
      ],
      error: null,
    });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments("obj-1"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fromMock).toHaveBeenCalledWith("objective_comments");
    expect(builder.eq).toHaveBeenCalledWith("objective_id", "obj-1");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0]).toMatchObject({
      id: "c1",
      content: "Hello",
      author: { full_name: "Alice" },
    });
  });

  it("filters by keyResultId when provided", async () => {
    const builder = makeBuilder({ data: [], error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    renderHook(() => useObjectiveComments("obj-1", { keyResultId: "kr-9" }), { wrapper });

    await waitFor(() => expect(builder.eq).toHaveBeenCalledWith("key_result_id", "kr-9"));
  });

  it("returns [] when objectiveId is undefined (query disabled)", async () => {
    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments(undefined), { wrapper });

    await waitFor(() => expect(result.current.comments).toEqual([]));
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("useObjectiveComments — createComment", () => {
  it("inserts with the right shape, toasts success, tracks event", async () => {
    const builder = makeBuilder({ data: { id: "new-id" }, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments("obj-1"), { wrapper });

    await act(async () => {
      await result.current.createComment.mutateAsync({
        content: "  Hello world  ",
        authorId: "u-1",
      });
    });

    expect(builder.insert).toHaveBeenCalledWith({
      objective_id: "obj-1",
      key_result_id: null,
      parent_comment_id: null,
      author_id: "u-1",
      content: "Hello world",
    });
    expect(toastMock.success).toHaveBeenCalledWith("Comentário publicado");
    expect(trackEventMock).toHaveBeenCalledWith("objective_comment_posted", {
      objective_id: "obj-1",
    });
  });

  it("rejects empty content without hitting supabase", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments("obj-1"), { wrapper });

    await act(async () => {
      await expect(
        result.current.createComment.mutateAsync({ content: "   ", authorId: "u-1" }),
      ).rejects.toThrow(/entre 1 e 5000/);
    });

    expect(builder.insert).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  });
});

describe("useObjectiveComments — updateComment", () => {
  it("patches content and edited_at, toasts success", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments("obj-1"), { wrapper });

    await act(async () => {
      await result.current.updateComment.mutateAsync({
        commentId: "c1",
        content: "Updated body",
      });
    });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Updated body", edited_at: expect.any(String) }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(toastMock.success).toHaveBeenCalledWith("Comentário atualizado");
  });
});

describe("useObjectiveComments — deleteComment", () => {
  it("deletes by id and toasts removal", async () => {
    const builder = makeBuilder({ data: null, error: null });
    fromMock.mockImplementation(() => builder);

    const { useObjectiveComments } = await import("./useObjectiveComments");
    const { result } = renderHook(() => useObjectiveComments("obj-1"), { wrapper });

    await act(async () => {
      await result.current.deleteComment.mutateAsync("c1");
    });

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
    expect(toastMock.success).toHaveBeenCalledWith("Comentário removido");
  });
});
