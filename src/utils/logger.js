/**
 * utils/logger.js — Layer: Utility / Observability
 *
 * Thin logging facade that gates output on the current environment:
 *
 *  Development (import.meta.env.DEV === true):
 *    All four methods (error, warn, log, info) write to the browser console.
 *
 *  Production:
 *    - `error` silently forwards exceptions to Sentry via captureException.
 *    - `warn`, `log`, `info` are silent no-ops to avoid leaking internal details.
 *
 * This design keeps the console clean in production while ensuring real errors
 * are captured by Sentry for alerting and triage, without requiring callers to
 * import Sentry directly.
 */
import * as Sentry from '@sentry/react';

// True only when Vite's dev server is running (npm run dev).
// False for `npm run build` output regardless of VITE_ENV value.
const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Logs an error message and, in production, forwards the exception to Sentry.
   * In development the full stack trace is printed to the console instead.
   * Use this for unexpected failures that need investigation.
   *
   * @param {string} message - Human-readable description of the failure context
   * @param {Error|null} error - The caught error object (optional but recommended)
   */
  error: (message, error = null) => {
    if (isDev) {
      console.error(message, error);
    }
    // In production, only forward to Sentry when an actual Error object is
    // available; bare string messages are attached as `extra` context.
    if (error && !isDev) {
      Sentry.captureException(error, { extra: { message } });
    }
  },

  /**
   * Logs a non-fatal warning. Development-only; silent in production.
   * Use for recoverable states that are worth tracking during development
   * (e.g. a missing optional field, a deprecated code path).
   *
   * @param {string} message - Warning description
   * @param {*} data - Optional supporting data to log alongside the message
   */
  warn: (message, data = null) => {
    if (isDev) {
      console.warn(message, data);
    }
  },

  /**
   * General-purpose debug log. Development-only; silent in production.
   *
   * @param {string} message - Log message
   * @param {*} data - Optional data to log alongside the message
   */
  log: (message, data = null) => {
    if (isDev) {
      console.log(message, data);
    }
  },

  /**
   * Informational log. Development-only; silent in production.
   * Semantically identical to `log` but maps to console.info, which some
   * browser DevTools display with a different icon.
   *
   * @param {string} message - Info message
   * @param {*} data - Optional data to log alongside the message
   */
  info: (message, data = null) => {
    if (isDev) {
      console.info(message, data);
    }
  }
};

export default logger;
