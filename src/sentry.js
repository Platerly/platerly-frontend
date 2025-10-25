// src/sentry.js
import * as Sentry from "@sentry/react";

const inProd = import.meta.env.VITE_ENV === "production";
const force = import.meta.env.VITE_SENTRY_FORCE === "1";

if (!(inProd || force)) {
  console.log("[Sentry] init skipped (VITE_ENV != 'production' and no FORCE).");
}

if ((inProd || force) && import.meta.env.VITE_SENTRY_DSN) {
  console.log("[Sentry] initializing…");
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.02,
    replaysOnErrorSampleRate: 0.5,
    environment: import.meta.env.VITE_ENV,
  });
}
