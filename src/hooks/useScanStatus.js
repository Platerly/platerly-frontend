// src/hooks/useScanStatus.js
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'

const CACHE_KEY = 'pl_scan_status_v1'
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

export function clearScanStatusCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}

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
  const [status, setStatus] = useState(() => readCache())
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  const fetchStatus = useCallback(async (options = {}) => {
    const { silent = false } = options

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

      const data = await res.json()
      const normalized = {
        scansUsed: data.scansUsed ?? 0,
        scansLimit: data.scansLimit ?? null,
        scansRemaining: data.scansRemaining ?? null,
        weekResetsAt: data.weekResetsAt ?? null,
        isPremium: data.isPremium ?? false,
      }

      setStatus(normalized)
      writeCache(normalized)
      return normalized
    } catch (err) {
      logger.error('Failed to fetch scan status', err)
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user?.id, token])

  const invalidate = useCallback(() => {
    clearScanStatusCache()
    setStatus(null)
    fetchedRef.current = false
  }, [])

  useEffect(() => {
    if (!authed) {
      setStatus(null)
      clearScanStatusCache()
      fetchedRef.current = false
      return
    }

    if (!fetchedRef.current && !status) {
      fetchedRef.current = true
      fetchStatus({ silent: true })
    }
  }, [authed, status, fetchStatus])

  const atLimit = !status?.isPremium
    && status?.scansRemaining !== null
    && status?.scansRemaining !== undefined
    && status.scansRemaining <= 0

  return {
    scansUsed: status?.scansUsed ?? 0,
    scansLimit: status?.scansLimit ?? null,
    scansRemaining: status?.scansRemaining ?? null,
    weekResetsAt: status?.weekResetsAt ?? null,
    isPremium: status?.isPremium ?? false,
    atLimit,
    loading,
    refetch: fetchStatus,
    invalidate,
  }
}
