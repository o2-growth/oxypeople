import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
    opt_out_capturing: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
  },
}));

describe("analytics (no key)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_POSTHOG_KEY", "");
  });

  it("initAnalytics does not call posthog.init when key is empty", async () => {
    const posthog = (await import("posthog-js")).default;
    const { initAnalytics } = await import("./analytics");
    initAnalytics();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("identifyUser is a no-op before init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { identifyUser } = await import("./analytics");
    identifyUser({ id: "u1" });
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it("trackEvent is a no-op before init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { trackEvent } = await import("./analytics");
    trackEvent("clicked");
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("resetAnalytics is a no-op before init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { resetAnalytics } = await import("./analytics");
    resetAnalytics();
    expect(posthog.reset).not.toHaveBeenCalled();
  });
});

describe("analytics (with key)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://analytics.example");
  });

  it("initAnalytics passes config to posthog.init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { initAnalytics } = await import("./analytics");
    initAnalytics();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    const [key, opts] = (posthog.init as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toBe("phc_test");
    expect(opts).toMatchObject({
      api_host: "https://analytics.example",
      autocapture: false,
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  });

  it("identifyUser forwards email and company_id after init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { initAnalytics, identifyUser } = await import("./analytics");
    initAnalytics();
    identifyUser({ id: "u1", email: "x@y.com", companyId: "c1" });
    expect(posthog.identify).toHaveBeenCalledWith("u1", {
      email: "x@y.com",
      company_id: "c1",
    });
  });

  it("trackEvent forwards event name and props after init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { initAnalytics, trackEvent } = await import("./analytics");
    initAnalytics();
    trackEvent("kr_checkin", { value: 42 });
    expect(posthog.capture).toHaveBeenCalledWith("kr_checkin", { value: 42 });
  });

  it("resetAnalytics calls posthog.reset after init", async () => {
    const posthog = (await import("posthog-js")).default;
    const { initAnalytics, resetAnalytics } = await import("./analytics");
    initAnalytics();
    resetAnalytics();
    expect(posthog.reset).toHaveBeenCalledTimes(1);
  });
});
