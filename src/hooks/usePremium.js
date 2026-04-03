/**
 * hooks/usePremium.js — Layer: Hook / Subscription status
 *
 * Fetches and caches the current user's premium + trial subscription status from
 * GET /api/billing/status.  Trial state is bundled with premium state in a single
 * hook because the two are tightly coupled in the UI: components that gate features
 * need to check `isPremium || isOnTrial`, and rendering the TrialExpiryBanner
 * requires trialDaysRemaining from the same API call.
 *
 * Cache strategy:
 *  - Key : `pl_premium_status_v2` in localStorage
 *  - TTL : 1 minute — short enough to reflect a recent upgrade promptly, long
 *          enough to avoid hammering the billing endpoint on every render.
 *  - On logout : cache is cleared via the exported clearPremiumCache() function,
 *    which AuthContext calls during logout so the next user session starts clean.
 *
 * Returned fields:
 *  isPremium         {boolean}       — Active paid subscription
 *  premiumStatus     {string|null}   — Stripe subscription status string
 *  cancelAtPeriodEnd {boolean}       — Subscription set to cancel at cycle end
 *  currentPeriodEnd  {string|null}   — ISO date of the billing period end
 *  isOnTrial         {boolean}       — Within the 7-day free trial window
 *  trialEndsAt       {string|null}   — ISO date when the trial expires
 *  trialDaysRemaining {number|null}  — Countdown days (null when not on trial)
 *  loading           {boolean}       — True while the first fetch is in flight
 *  refetch           {function}      — Manually re-fetches (e.g. after a Stripe redirect)
 *  requirePremium    {function}      — Calls callback only if isPremium is true
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'
import { validateBillingStatus } from '../utils/schemas'

const RETRY_DELAY_MS = 5_000 // one automatic retry after 5 seconds on failure

// Cache key versioned at v2 to add isOnTrial / trial fields without reading stale v1 entries
const CACHE_KEY = 'pl_premium_status_v2'
// Cache TTL: 1 minute — quick enough to reflect upgrades, light enough on the API
const CACHE_TTL_MS = 1 * 60 * 1000 // 1 minute

/**
 * Hook to check premium subscription status.
 * Caches the result to avoid repeated API calls.
 *
 * Usage:
 *   const { isPremium, loading, refetch } = usePremium()
 *   if (!isPremium) return <UpgradePrompt />
 */
export function usePremium() {
  const { user, token, authed } = useAuth()
  // Initialise from cache so components render the correct gate state immediately
  // on mount, without waiting for the network request to complete.
  const [status, setStatus] = useState(() => readCache())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Prevent duplicate fetches: set to true after the first fetch is kicked off
  const fetchedRef = useRef(false)
  // Holds the one automatic retry timeout so it can be cancelled on unmount
  const retryTimerRef = useRef(null)

  /**
   * Reads the cached premium status from localStorage.
   * Returns null if no cache exists or the entry has expired (TTL exceeded).
   *
   * @returns {object|null} Cached status object or null
   */
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const cached = JSON.parse(raw)
      // Evict stale cache entries immediately rather than serving outdated status
      if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }
      return cached.data
    } catch {
      return null
    }
  }

  /**
   * Persists a freshly-fetched status object to localStorage with the current timestamp.
   *
   * @param {object} data - Normalised premium status object
   */
  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch { /* ignore */ }
  }

  /**
   * Removes the cached status entry.  Called on logout and when the hook
   * detects that the user is no longer authenticated.
   */
  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch { /* ignore */ }
  }

  /**
   * Fetches premium status from GET /api/billing/status and normalises the
   * response.  Writes the result to cache and React state on success.
   *
   * The `silent` option suppresses the `loading` state update, which is used
   * during background/initial fetches to avoid flashing a loading spinner when
   * a cached value is already displayed.
   *
   * @param {{ silent?: boolean }} options
   * @returns {Promise<object|null>} Normalised status, or null on error
   */
  const fetchStatus = useCallback(async (options = {}) => {
    const { silent = false, _isRetry = false } = options

    if (!user?.id || !token) {
      setStatus(null)
      return null
    }

    try {
      if (!silent) setLoading(true)

      const res = await fetch(
        `${API_BASE_URL}/api/billing/status?userId=${encodeURIComponent(user.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        throw new Error(`Status ${res.status}`)
      }

      const data = validateBillingStatus(await res.json())
      // Normalise both camelCase and PascalCase field names from the API
      const normalized = {
        isPremium: data.isPremium ?? data.IsPremium ?? false,
        premiumStatus: data.premiumStatus ?? data.PremiumStatus ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? data.premiumCancelAtPeriodEnd ?? false,
        currentPeriodEnd: data.currentPeriodEnd ?? data.premiumCurrentPeriodEnd ?? null,
        isOnTrial: data.isOnTrial ?? false,
        trialEndsAt: data.trialEndsAt ?? null,
        trialDaysRemaining: data.trialDaysRemaining ?? null,
      }

      setStatus(normalized)
      setError(null)
      writeCache(normalized)
      return normalized
    } catch (err) {
      logger.error('Failed to fetch premium status', err)
      // Keep any existing status (don't silently downgrade to free tier)
      // and surface the error so the UI can inform the user.
      setError('Could not load subscription status. Please try again.')
      // One automatic retry after 5 seconds (not triggered by a prior retry)
      if (!_isRetry) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = setTimeout(() => {
          fetchStatus({ silent: true, _isRetry: true })
        }, RETRY_DELAY_MS)
      }
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user?.id, token])

  // Initial fetch when user/token changes — only runs once per session thanks to
  // fetchedRef.  Skips fetch entirely when a valid cache entry was already loaded.
  useEffect(() => {
    if (!authed) {
      // User logged out — reset all state and allow a fresh fetch on next login
      clearTimeout(retryTimerRef.current)
      setStatus(null)
      setError(null)
      clearCache()
      fetchedRef.current = false
      return
    }

    // Only fetch if we haven't already and there's no valid cache
    if (!fetchedRef.current && !status) {
      fetchedRef.current = true
      fetchStatus({ silent: true })
    }
  }, [authed, status, fetchStatus])

  // Cancel any pending retry timer on unmount
  useEffect(() => () => clearTimeout(retryTimerRef.current), [])

  return {
    // Core status
    isPremium: status?.isPremium ?? false,
    premiumStatus: status?.premiumStatus,
    cancelAtPeriodEnd: status?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: status?.currentPeriodEnd,

    // Trial — bundled here because trial grants the same feature access as premium
    isOnTrial: status?.isOnTrial ?? false,
    trialEndsAt: status?.trialEndsAt ?? null,
    trialDaysRemaining: status?.trialDaysRemaining ?? null,

    // Loading state
    loading,

    // error is set when the fetch failed (and no cached status is available)
    error,

    // Refetch function — call after Stripe checkout success to pick up new status
    refetch: fetchStatus,

    /**
     * Utility for conditionally executing premium-gated callbacks.
     * Does NOT account for trial — use `isPremium || isOnTrial` for trial-inclusive checks.
     *
     * @param {function} callback - Called only when isPremium is true
     */
    requirePremium: (callback) => {
      if (status?.isPremium) {
        callback()
      }
    },
  }
}

/**
 * Clears the premium status cache from localStorage.
 * Exported for use by AuthContext.logout() to ensure a fresh fetch after sign-out.
 */
export function clearPremiumCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}
