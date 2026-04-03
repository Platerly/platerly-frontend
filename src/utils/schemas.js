/**
 * utils/schemas.js — Zod schemas for critical API response shapes.
 *
 * These schemas validate responses at the boundary where external data enters the
 * app.  Validation failures are logged as warnings (not thrown) so the app degrades
 * gracefully if the API returns an unexpected shape rather than crashing.
 *
 * Usage:
 *   import { validateAuthResponse, validateBillingStatus } from './schemas'
 *   const data = await res.json()
 *   const validated = validateAuthResponse(data)   // returns data, logs on mismatch
 */
import { z } from 'zod'
import { logger } from './logger'

// ── Auth response (login + token refresh) ────────────────────────────────────

export const AuthResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.union([z.string(), z.number()]),
    email: z.string(),
    username: z.string().optional(),
    displayName: z.string().optional(),
    role: z.string().optional(),
    Role: z.string().optional(),
    isPremium: z.boolean().optional(),
    isEmailVerified: z.boolean().optional(),
  }).passthrough(), // allow server-added fields without breaking validation
  isNewUser: z.boolean().optional(),
}).passthrough()

// ── Billing / premium status response ────────────────────────────────────────

export const BillingStatusSchema = z.object({
  isPremium: z.boolean().optional(),
  IsPremium: z.boolean().optional(),
  premiumStatus: z.string().nullable().optional(),
  PremiumStatus: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  premiumCancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodEnd: z.string().nullable().optional(),
  premiumCurrentPeriodEnd: z.string().nullable().optional(),
  isOnTrial: z.boolean().optional(),
  trialEndsAt: z.string().nullable().optional(),
  trialDaysRemaining: z.number().nullable().optional(),
}).passthrough()

// ── Scan status response ──────────────────────────────────────────────────────

export const ScanStatusSchema = z.object({
  scansUsed: z.number().optional(),
  scansLimit: z.number().nullable().optional(),
  scansRemaining: z.number().nullable().optional(),
  weekResetsAt: z.string().nullable().optional(),
  isPremium: z.boolean().optional(),
}).passthrough()

// ── Validation helper ─────────────────────────────────────────────────────────

/**
 * Validates `data` against `schema`.  On success returns the data unchanged.
 * On failure, logs a warning with the parse errors and returns the original data
 * so callers can continue with their own normalisation logic.
 *
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @param {string} label - Human-readable name for log messages (e.g. 'AuthResponse')
 * @returns {unknown} The original data (validated or not)
 */
function validate(schema, data, label) {
  const result = schema.safeParse(data)
  if (!result.success) {
    logger.warn(`[schema] ${label} response shape mismatch`, result.error.flatten())
  }
  return data
}

export const validateAuthResponse   = (data) => validate(AuthResponseSchema,   data, 'AuthResponse')
export const validateBillingStatus  = (data) => validate(BillingStatusSchema,  data, 'BillingStatus')
export const validateScanStatus     = (data) => validate(ScanStatusSchema,     data, 'ScanStatus')
