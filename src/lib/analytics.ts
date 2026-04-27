import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (!KEY) {
    if (import.meta.env.DEV) {
      console.info("[PostHog] VITE_POSTHOG_KEY not set — skipping init");
    }
    return;
  }

  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    autocapture: false,
    persistence: "localStorage",
    person_profiles: "identified_only",
  });
  initialized = true;
}

type AnalyticsUser = { id: string; email?: string; companyId?: string };

export function identifyUser(user: AnalyticsUser) {
  if (!initialized) return;
  posthog.identify(user.id, {
    email: user.email,
    company_id: user.companyId,
  });
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(name, properties);
}

export function optOutAnalytics() {
  if (!initialized) return;
  posthog.opt_out_capturing();
}

export function isOptedOut(): boolean {
  if (!initialized) return false;
  return posthog.has_opted_out_capturing();
}
