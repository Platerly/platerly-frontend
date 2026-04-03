/**
 * hooks/useB2BSubscription.js — Layer: Hook / B2B subscription status
 *
 * Fetches and caches the current user's B2B API subscription status from
 * GET /api/b2b-billing/status.
 *
 * Mirrors the structure of usePremium.js so the pattern is familiar:
 *  - localStorage cache with a 2-minute TTL
 *  - Clears on logout via exported clearB2BSubscriptionCache()
 *  - Returns loading + refetch so components can react to Stripe redirects
 *
 * Returned fields:
 *  isActive          {boolean}         — B2B subscription is active
 *  planTier          {string|null}      — "starter" | "professional" | "enterprise" | null
 *  planStatus        {string|null}      — Raw Stripe status (active, past_due, canceled…)
 *  cancelAtPeriodEnd {boolean}          — Subscription set to cancel at cycle end
 *  currentPeriodEnd  {string|null}      — ISO date of billing period end
 *  subscribedSince   {string|null}      — ISO date when subscription first activated
 *  companyName       {string|null}      — Business name on the B2B account
 *  billingEmail      {string|null}      — Billing contact email
 *  loading           {boolean}          — True while first fetch is in flight
 *  refetch           {function}         — Manually re-fetch (call after Stripe redirect)
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { logger } from '../utils/logger'

const CACHE_KEY = 'pl_b2b_status_v1'
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

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
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch { /* ignore */ }
}

export function useB2BSubscription() {
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

      const res = await fetch(
        `${API_BASE_URL}/api/b2b-billing/status?userId=${encodeURIComponent(user.id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) throw new Error(`Status ${res.status}`)

      const data = await res.json()
      const normalized = {
        isActive: data.isActive ?? data.IsActive ?? false,
        planTier: data.planTier ?? data.PlanTier ?? null,
        planStatus: data.planStatus ?? data.PlanStatus ?? null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? data.CancelAtPeriodEnd ?? false,
        currentPeriodEnd: data.currentPeriodEnd ?? data.CurrentPeriodEnd ?? null,
        subscribedSince: data.subscribedSince ?? data.SubscribedSince ?? null,
        companyName: data.companyName ?? data.CompanyName ?? null,
        billingEmail: data.billingEmail ?? data.BillingEmail ?? null,
      }

      setStatus(normalized)
      writeCache(normalized)
      return normalized
    } catch (err) {
      logger.error('Failed to fetch B2B subscription status', err)
      setStatus(null)
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    if (!authed) {
      setStatus(null)
      try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
      fetchedRef.current = false
      return
    }

    if (!fetchedRef.current && !status) {
      fetchedRef.current = true
      fetchStatus({ silent: true })
    }
  }, [authed, status, fetchStatus])

  return {
    isActive: status?.isActive ?? false,
    planTier: status?.planTier ?? null,
    planStatus: status?.planStatus ?? null,
    cancelAtPeriodEnd: status?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: status?.currentPeriodEnd ?? null,
    subscribedSince: status?.subscribedSince ?? null,
    companyName: status?.companyName ?? null,
    billingEmail: status?.billingEmail ?? null,
    loading,
    refetch: fetchStatus,
  }
}

export function clearB2BSubscriptionCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}
