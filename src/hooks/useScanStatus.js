/**
 * hooks/useScanStatus.js — Layer: Hook / Allergen scan quota
 *
 * Tracks the current user's weekly allergen scan usage against the free tier
 * limit of 3 scans per rolling week (Monday midnight UTC reset).
 *
 * The backend enforces this limit; this hook reads the quota status from
 * GET /api/allergen-scans/status and caches it locally so components can
 * gate UI elements without blocking on a network request.
 *
 * Cache strategy:
 *  - Key : `pl_scan_status_v1` in localStorage
 *  - TTL : 2 minutes — slightly longer than usePremium since scan counts change
 *    less frequently than premium status and 2 min is short enough to reflect a
 *    scan that just used the last quota slot.
 *
 * Returned fields:
 *  scansUsed       {number}         — Scans consumed this week
 *  scansLimit      {number|null}    — Weekly limit (null for premium/trial users = unlimited)
 *  scansRemaining  {number|null}    — Scans left this week (null = unlimited)
 *  weekResetsAt    {string|null}    — ISO datetime of the next Monday midnight UTC reset
 *  isPremium       {boolean}        — Mirrors premium status from the scan endpoint
 *  atLimit         {boolean}        — Derived: true when a free user has 0 scans remaining
 *  loading         {boolean}        — True while the first fetch is in flight
 *  refetch         {function}       — Manually re-fetches (call after a successful scan)
 *  invalidate      {function}       — Clears cache + state, forcing a fresh fetch on next render
 *
 * Exported standalone:
 *  clearScanStatusCache()           — Clears the localStorage cache entry.
 *    Call this after a scan succeeds or a 402 limit-reached response is received
 *    so that the stale "remaining = 1" entry is not served from cache.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'
import { validateScanStatus } from '../utils/schemas'

const RETRY_DELAY_MS = 5_000 // one automatic retry after 5 seconds on failure

// Versioned cache key — bump the suffix if the cached shape changes
const CACHE_KEY = 'pl_scan_status_v1'
// 2-minute TTL: fresh enough to reflect a just-used scan, light enough on the API
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Removes the scan status cache entry from localStorage.
 * Exported so calling code (RecipeDetailsPage, ScanCounter) can invalidate the
 * cache immediately after a scan completes or a 402 is received, without needing
 * to hold a reference to the hook's internal invalidate function.
 */
export function clearScanStatusCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}

/**
 * Reads the scan status from localStorage, returning null if absent or expired.
 *
 * @returns {object|null}
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    // Evict stale entries so a user who just hit the limit sees updated state
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
 * Writes the current scan status to localStorage with a timestamp for TTL tracking.
 *
 * @param {object} data - Normalised scan status object
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
 * Hook to check the user's weekly allergen scan quota.
 *
 * Returns:
 *   scansUsed, scansLimit (null if premium), scansRemaining (null if premium),
 *   weekResetsAt, isPremium, atLimit, loading, refetch, invalidate
 */
export function useScanStatus() {
  const { user, token, authed } = useAuth()
  // Seed from cache so gate components render correctly on mount without a network round-trip
  const [status, setStatus] = useState(() => readCache())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Prevents duplicate fetches across re-renders
  const fetchedRef = useRef(false)
  // Holds the one automatic retry timeout so it can be cancelled on unmount
  const retryTimerRef = useRef(null)

  /**
   * Fetches current scan quota from the backend and updates cache + state.
   * The `silent` option suppresses the loading spinner — used during background
   * fetches when a cached value is already shown.
   *
   * @param {{ silent?: boolean }} options
   * @returns {Promise<object|null>}
   */
  const fetchStatus = useCallback(async (options = {}) => {
    const { silent = false, _isRetry = false } = options

    if (!user?.id || !token) {
      setStatus(null)
      return null
    }

    try {
      if (!silent) setLoading(true)

      const res = await fetch(`${API_BASE_URL}/api/allergen-scans/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error(`Status ${res.status}`)

      const data = validateScanStatus(await res.json())
      // scansLimit and scansRemaining are null for premium/trial users (unlimited)
      const normalized = {
        scansUsed: data.scansUsed ?? 0,
        scansLimit: data.scansLimit ?? null,
        scansRemaining: data.scansRemaining ?? null,
        weekResetsAt: data.weekResetsAt ?? null,
        isPremium: data.isPremium ?? false,
      }

      setStatus(normalized)
      setError(null)
      writeCache(normalized)
      return normalized
    } catch (err) {
      logger.error('Failed to fetch scan status', err)
      // Keep any existing status rather than resetting (avoids false "unlimited" flash)
      setError('Could not load scan quota. Please try again.')
      // One automatic retry after 5 seconds
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

  /**
   * Clears the localStorage cache and resets local state, then allows the next
   * render cycle to trigger a fresh fetch.  Use this after a scan completes or
   * a 402 is received to ensure the UI reflects the actual remaining quota.
   */
  const invalidate = useCallback(() => {
    clearScanStatusCache()
    setStatus(null)
    // Reset the guard so the useEffect below will kick off a fresh fetch
    fetchedRef.current = false
  }, [])

  // Bootstrap fetch: runs once when the user is first authenticated.
  // Skipped when a valid cache entry was already loaded into state.
  useEffect(() => {
    if (!authed) {
      // Logged out — clear all state so the next login starts fresh
      clearTimeout(retryTimerRef.current)
      setStatus(null)
      setError(null)
      clearScanStatusCache()
      fetchedRef.current = false
      return
    }

    if (!fetchedRef.current && !status) {
      fetchedRef.current = true
      fetchStatus({ silent: true })
    }
  }, [authed, status, fetchStatus])

  // Cancel any pending retry timer on unmount
  useEffect(() => () => clearTimeout(retryTimerRef.current), [])

  // Derived field: a free user is at their limit when scansRemaining is 0 or below.
  // Issue 9: use typeof check to guard against non-numeric values (null = unlimited).
  const atLimit = !status?.isPremium
    && typeof status?.scansRemaining === 'number'
    && status.scansRemaining <= 0

  return {
    scansUsed: status?.scansUsed ?? 0,
    scansLimit: status?.scansLimit ?? null,       // null = unlimited (premium)
    scansRemaining: status?.scansRemaining ?? null, // null = unlimited (premium)
    weekResetsAt: status?.weekResetsAt ?? null,
    isPremium: status?.isPremium ?? false,
    atLimit,     // true only for free users with 0 scans remaining this week
    loading,
    error,       // non-null when the last fetch failed; cleared on next success
    refetch: fetchStatus,
    invalidate,  // clears cache + state, used by ScanCounter and RecipeDetailsPage
  }
}
