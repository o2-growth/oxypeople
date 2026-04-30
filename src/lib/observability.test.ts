import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  reactRouterV6BrowserTracingIntegration: vi.fn(() => ({ name: "ReactRouterV6BrowserTracing" })),
  replayIntegration: vi.fn(() => ({ name: "Replay" })),
  withSentryReactRouterV6Routing: vi.fn((Routes) => Routes),
}));

describe("observability (no DSN)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_SENTRY_DSN", "");
  });

  it("initSentry is a no-op when VITE_SENTRY_DSN is empty", async () => {
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("./observability");
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("setSentryUser is a no-op when VITE_SENTRY_DSN is empty", async () => {
    const Sentry = await import("@sentry/react");
    const { setSentryUser } = await import("./observability");
    setSentryUser({ id: "u1", email: "x@y.com" });
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("clearSentryUser is a no-op when VITE_SENTRY_DSN is empty", async () => {
    const Sentry = await import("@sentry/react");
    const { clearSentryUser } = await import("./observability");
    clearSentryUser();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it("captureException falls back to console.error when DSN is empty", async () => {
    const Sentry = await import("@sentry/react");
    const { captureException } = await import("./observability");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    captureException(err, { foo: "bar" });
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[Captured]", err, { foo: "bar" });
    spy.mockRestore();
  });
});

describe("observability (with DSN)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@sentry.example/123");
  });

  it("initSentry forwards DSN and integrations to Sentry.init", async () => {
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("./observability");
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    const config = (Sentry.init as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(config.dsn).toBe("https://public@sentry.example/123");
    expect(config.integrations).toHaveLength(2);
    expect(typeof config.beforeSend).toBe("function");
  });

  it("beforeSend strips cookies and authorization header", async () => {
    const Sentry = await import("@sentry/react");
    const { initSentry } = await import("./observability");
    initSentry();
    const config = (Sentry.init as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const event = {
      request: {
        cookies: { session: "secret" },
        headers: { authorization: "Bearer token" },
      },
    };
    const result = config.beforeSend(event);
    expect(result.request.cookies).toBeUndefined();
    expect(result.request.headers.authorization).toBe("[FILTERED]");
  });

  it("setSentryUser includes id, email and company_id", async () => {
    const Sentry = await import("@sentry/react");
    const { setSentryUser } = await import("./observability");
    setSentryUser({ id: "u1", email: "x@y.com", companyId: "c1" });
    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: "u1",
      email: "x@y.com",
      company_id: "c1",
    });
  });

  it("captureException forwards to Sentry with extra context", async () => {
    const Sentry = await import("@sentry/react");
    const { captureException } = await import("./observability");
    const err = new Error("boom");
    captureException(err, { route: "/x" });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: { route: "/x" } });
  });
});
