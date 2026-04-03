/**
 * sentry.js — Layer: Bootstrap / Error monitoring
 *
 * Initialises Sentry for frontend error tracking and performance monitoring.
 * This module is imported at the very top of main.jsx, before React is mounted,
 * so that any errors thrown during app bootstrap are also captured.
 *
 * When Sentry initialises:
 *  - VITE_ENV === 'production'  AND  VITE_SENTRY_DSN is set → always initialises
 *  - VITE_SENTRY_FORCE === '1'  AND  VITE_SENTRY_DSN is set → force-initialises
 *    (useful for testing Sentry integration in staging without setting VITE_ENV=production)
 *  - Any other environment → skips init and logs a console message
 *
 * DSN source:
 *  The DSN is read from the VITE_SENTRY_DSN environment variable, which is set
 *  in .env.production (or Azure App Settings for deployed environments).
 *  It is intentionally NOT hardcoded here to avoid committing credentials.
 *
 * What gets tracked:
 *  - Unhandled JS exceptions and promise rejections (automatic)
 *  - Manual captures via logger.error() in utils/logger.js
 *  - Performance traces (20% sample rate — tracesSampleRate: 0.2)
 *  - Session replays: 2% of all sessions, 50% of sessions with errors
 *    (replaysSessionSampleRate / replaysOnErrorSampleRate)
 *
 * Integrations enabled:
 *  - browserTracingIntegration : automatic page-load and navigation performance spans
 *  - replayIntegration         : session replay for error diagnosis
 */
import * as Sentry from "@sentry/react";

// True when running in the production build with VITE_ENV set to 'production'
const inProd = import.meta.env.VITE_ENV === "production";
// Development override: set VITE_SENTRY_FORCE=1 in .env.local to test Sentry locally
const force = import.meta.env.VITE_SENTRY_FORCE === "1";

if (!(inProd || force)) {
  console.log("[Sentry] init skipped (VITE_ENV != 'production' and no FORCE).");
}

if ((inProd || force) && import.meta.env.VITE_SENTRY_DSN) {
  console.log("[Sentry] initializing…");
  Sentry.init({
    // DSN identifies the Sentry project that receives events
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(), // automatic performance instrumentation
      Sentry.replayIntegration(),          // session replay for error context
    ],
    // Capture 20% of transactions for performance monitoring (keep costs manageable)
    tracesSampleRate: 0.2,
    // Record a replay for 2% of normal sessions (background insight)
    replaysSessionSampleRate: 0.02,
    // Record a replay for 50% of sessions that contain an error (high-value debugging context)
    replaysOnErrorSampleRate: 0.5,
    // Tag all events with the current environment for filtering in the Sentry dashboard
    environment: import.meta.env.VITE_ENV,
  });
}
