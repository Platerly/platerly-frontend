// src/hooks/usePremium.js
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'

const CACHE_KEY = 'pl_premium_status_v1'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

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
  const [status, setStatus] = useState(() => readCache())
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  // Read cached status from localStorage
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const cached = JSON.parse(raw)
      if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }
      return cached.data
    } catch {
      return null
    }
  }

  // Write status to localStorage cache
  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch {}
  }

  // Clear cache (call on logout)
  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch {}
  }

  const fetchStatus = useCallback(async (options = {}) => {
    const { silent = false } = options

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

      const data = await res.json()
      const normalized = {
        isPremium: data.isPremium ?? data.IsPremium ?? false,
        premiumStatus: data.premiumStatus ?? data.PremiumStatus ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? data.premiumCancelAtPeriodEnd ?? false,
        currentPeriodEnd: data.currentPeriodEnd ?? data.premiumCurrentPeriodEnd ?? null,
      }

      setStatus(normalized)
      writeCache(normalized)
      return normalized
    } catch (err) {
      logger.error('Failed to fetch premium status', err)
      setStatus(null)
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user?.id, token])

  // Initial fetch when user/token changes
  useEffect(() => {
    if (!authed) {
      setStatus(null)
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

  return {
    // Core status
    isPremium: status?.isPremium ?? false,
    premiumStatus: status?.premiumStatus,
    cancelAtPeriodEnd: status?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: status?.currentPeriodEnd,

    // Loading state
    loading,

    // Refetch function
    refetch: fetchStatus,

    // Helper for feature gating
    requirePremium: (callback) => {
      if (status?.isPremium) {
        callback()
      }
    },
  }
}

/**
 * Clears the premium status cache.
 * Call this on logout.
 */
export function clearPremiumCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}
