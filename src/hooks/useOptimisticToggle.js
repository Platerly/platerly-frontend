/**
 * hooks/useOptimisticToggle.js — Layer: Hook / Optimistic UI
 *
 * Generic hook for boolean toggle actions that interact with an API
 * (likes, reposts, follows, bookmarks, etc.).
 *
 * Optimistic update pattern:
 *  1. User triggers a toggle.
 *  2. UI is updated immediately (isActive flips, count adjusts by ±1) so the
 *     interaction feels instant — no spinner required.
 *  3. The API call is made asynchronously in the background.
 *  4. If the call fails (non-2xx response or network error), the state is rolled
 *     back to the values captured before the optimistic update.
 *
 * Special cases handled:
 *  - 404 on untoggle (DELETE): treated as a success — the resource is already
 *    absent on the server so the optimistic state (isActive = false) is correct.
 *  - Concurrent clicks: `isLoading` guard prevents a second toggle while the
 *    first API call is still in flight.
 *  - Prop sync: useEffect syncs `isActive` and `count` when parent props change
 *    (e.g. after a feed refresh returns updated like counts).
 *
 * Also exports `formatCount` — a display utility that compacts large numbers
 * (1200 → "1.2K", 1500000 → "1.5M") used alongside toggle counts in the UI.
 */
import { useState, useCallback, useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook for optimistic toggle actions (like, repost, follow, etc.).
 * Immediately updates the UI, then syncs with the API. Reverts on failure.
 *
 * @param {Object} options
 * @param {boolean}  options.initialState - Initial active state (e.g. isLiked)
 * @param {number}   options.initialCount - Initial count value (e.g. likeCount)
 * @param {function(boolean): Promise<Response>} options.onToggle
 *   Async function that performs the API call.  Receives the state BEFORE the
 *   toggle (wasActive), so callers can pick DELETE vs POST based on it.
 * @param {function(Error): void} [options.onError]
 *   Optional callback invoked with the error on failure.  If omitted, failures
 *   are logged via logger.error.
 *
 * @returns {{
 *   isActive: boolean,
 *   count: number,
 *   isLoading: boolean,
 *   toggle: function,
 *   setActive: function,
 *   setCount: function
 * }}
 *
 * @example
 * const { isActive, count, toggle } = useOptimisticToggle({
 *   initialState: isLiked,
 *   initialCount: likes,
 *   onToggle: async (wasActive) => {
 *     return fetch(`/api/recipe/${id}/like`, {
 *       method: wasActive ? 'DELETE' : 'POST',
 *       headers: { Authorization: `Bearer ${token}` }
 *     })
 *   }
 * })
 */
export function useOptimisticToggle({
  initialState = false,
  initialCount = 0,
  onToggle,
  onError,
}) {
  const [isActive, setIsActive] = useState(initialState)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  // Keep local state in sync when parent re-renders with updated props
  // (e.g. after a feed pull-to-refresh returns a new like count from the server)
  useEffect(() => {
    setIsActive(initialState)
  }, [initialState])

  useEffect(() => {
    // Guard against NaN (e.g. undefined count from API) to keep count numeric
    setCount(typeof initialCount === 'number' && !isNaN(initialCount) ? initialCount : 0)
  }, [initialCount])

  /**
   * Executes the optimistic toggle:
   *  1. Snapshot current state for potential rollback.
   *  2. Apply optimistic update to both isActive and count.
   *  3. Call onToggle(wasActive) and await the response.
   *  4. On failure, restore snapshot values and report the error.
   */
  const toggle = useCallback(async () => {
    // Prevent concurrent toggles while an API call is already in flight
    if (isLoading || !onToggle) return

    // Save previous state for rollback
    const wasActive = isActive
    const prevCount = count

    // Optimistic update — flip the toggle and adjust count before the API responds
    setIsActive(!wasActive)
    setCount(prev => prev + (wasActive ? -1 : 1))
    setIsLoading(true)

    try {
      const res = await onToggle(wasActive)

      if (!res.ok) {
        // Special case: 404 on untoggle means already in that state on server —
        // the optimistic state (active = false, count decremented) is already correct
        if (wasActive && res.status === 404) {
          setIsLoading(false)
          return
        }

        // Any other non-OK response: revert to pre-toggle state
        setIsActive(wasActive)
        setCount(prevCount)
        throw new Error(`Toggle failed with status ${res.status}`)
      }
    } catch (err) {
      // Revert on error (covers network failures and the explicit throw above)
      setIsActive(wasActive)
      setCount(prevCount)

      if (onError) {
        onError(err)
      } else {
        logger.error('Toggle action failed', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isActive, count, isLoading, onToggle, onError])

  return {
    isActive,
    count,
    isLoading,
    toggle,
    setActive: setIsActive, // escape hatch for external state overrides
    setCount,               // escape hatch for server-confirmed count corrections
  }
}

/**
 * Formats a raw integer count for compact display next to toggles.
 * Follows the 1K / 1.5M shorthand convention common in social apps.
 *
 * Examples:  0 → "0",  999 → "999",  1200 → "1.2K",  1500000 → "1.5M"
 * Trailing ".0" is stripped for whole thousands/millions (1000 → "1K" not "1.0K").
 *
 * @param {number} count - Raw count value
 * @returns {string} Formatted string
 */
export function formatCount(count) {
  if (typeof count !== 'number' || isNaN(count)) return '0'
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return count.toString()
}
