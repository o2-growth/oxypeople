import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
  if (!DSN) {
    if (import.meta.env.DEV) {
      console.info("[Sentry] VITE_SENTRY_DSN not set — skipping init");
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers?.authorization) {
        event.request.headers.authorization = "[FILTERED]";
      }
      return event;
    },
  });
}

export const SentryRoutes = Sentry.withSentryReactRouterV6Routing;

type SentryUser = { id: string; email?: string; companyId?: string };

export function setSentryUser(user: SentryUser) {
  if (!DSN) return;
  Sentry.setUser({ id: user.id, email: user.email, company_id: user.companyId });
}

export function clearSentryUser() {
  if (!DSN) return;
  Sentry.setUser(null);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) {
    console.error("[Captured]", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}
