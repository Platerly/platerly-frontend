// src/hooks/useOptimisticToggle.js
import { useState, useCallback, useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook for optimistic toggle actions (like, repost, follow, etc.)
 * Immediately updates UI, then syncs with API. Reverts on failure.
 *
 * @param {Object} options
 * @param {boolean} options.initialState - Initial toggle state
 * @param {number} options.initialCount - Initial count value
 * @param {Function} options.onToggle - Async function to call API: (isActive) => Promise<Response>
 * @param {Function} options.onError - Optional error callback
 * @returns {Object} { isActive, count, toggle, setActive, setCount }
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

  // Sync with prop changes
  useEffect(() => {
    setIsActive(initialState)
  }, [initialState])

  useEffect(() => {
    setCount(typeof initialCount === 'number' && !isNaN(initialCount) ? initialCount : 0)
  }, [initialCount])

  const toggle = useCallback(async () => {
    if (isLoading || !onToggle) return

    // Save previous state for rollback
    const wasActive = isActive
    const prevCount = count

    // Optimistic update
    setIsActive(!wasActive)
    setCount(prev => prev + (wasActive ? -1 : 1))
    setIsLoading(true)

    try {
      const res = await onToggle(wasActive)

      if (!res.ok) {
        // Special case: 404 on untoggle means already in that state on server
        if (wasActive && res.status === 404) {
          setIsLoading(false)
          return
        }

        // Revert on failure
        setIsActive(wasActive)
        setCount(prevCount)
        throw new Error(`Toggle failed with status ${res.status}`)
      }
    } catch (err) {
      // Revert on error
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
    setActive: setIsActive,
    setCount,
  }
}

/**
 * Formats a count for display (1K, 1.5M, etc.)
 */
export function formatCount(count) {
  if (typeof count !== 'number' || isNaN(count)) return '0'
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return count.toString()
}
