// src/components/softwall/SoftWallRoot.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  SOFT_WALL_ENABLED,
  SOFT_WALL_DAILY_LIMIT,
  SOFT_WALL_COOLDOWN_MS,
  SOFT_WALL_ROLLING_WINDOW_MS,
  SOFT_WALL_KEYS
} from '../../config/softWall'

/* ---------- LocalStorage helpers ---------- */
const now = () => Date.now()

const readInt = (k, d = 0) => {
  try {
    const n = parseInt(localStorage.getItem(k) || '', 10)
    return Number.isFinite(n) ? n : d
  } catch { return d }
}
const writeInt = (k, v) => { try { localStorage.setItem(k, String(v)) } catch {} }

const readArray = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]') }
  catch { return [] }
}
const writeArray = (key, arr) => {
  try { localStorage.setItem(key, JSON.stringify(arr)) }
  catch {}
}

/* ---------- Path configuration ---------- */
const HARD_WALL_THRESHOLD = 10  // Blocking modal after this many views
const SOFT_BANNER_THRESHOLD = SOFT_WALL_DAILY_LIMIT  // Dismissable banner threshold

// Only these paths COUNT toward the wall and can SHOW it
const CONTENT_ALLOWLIST = [
  '/feed',
  '/explore',
  '/chefs',
  '/recipe',
  '/cookbooks',
  '/profile',
  '/tags',
]

const EXEMPT_PAGES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/privacy',
  '/terms',
]

const startsWithAny = (pathname, list) =>
  list.some(p => pathname === p || pathname.startsWith(p + '/'))

const isExempt = (pathname) => pathname === '/' || startsWithAny(pathname, EXEMPT_PAGES)
const isContentPath = (pathname) => startsWithAny(pathname, CONTENT_ALLOWLIST)

/**
 * Unified soft/hard wall system:
 * - Soft wall (banner): Dismissable prompt after SOFT_BANNER_THRESHOLD views
 * - Hard wall (modal): Blocking prompt after HARD_WALL_THRESHOLD views
 *
 * Uses rolling window for soft wall, cumulative count for hard wall.
 */
const SoftWallRoot = ({ children }) => {
  const { authed } = useAuth()
  const { pathname } = useLocation()

  // Cumulative count for hard wall
  const [totalViews, setTotalViews] = useState(() => readInt(SOFT_WALL_KEYS.viewsLog + '_total', 0))

  // Rolling window views for soft wall
  const [rollingViews, setRollingViews] = useState(0)

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Increment view count for guests on content routes
  useEffect(() => {
    if (!SOFT_WALL_ENABLED || authed) return
    if (!isContentPath(pathname)) return

    // Update cumulative count
    const nextTotal = totalViews + 1
    setTotalViews(nextTotal)
    writeInt(SOFT_WALL_KEYS.viewsLog + '_total', nextTotal)

    // Update rolling window
    const viewLog = readArray(SOFT_WALL_KEYS.viewsLog)
      .filter(ts => (now() - ts) <= SOFT_WALL_ROLLING_WINDOW_MS)
    viewLog.push(now())
    writeArray(SOFT_WALL_KEYS.viewsLog, viewLog)
    setRollingViews(viewLog.length)

    // Check cooldown for banner
    const dismissedAt = readInt(SOFT_WALL_KEYS.dismissedAt, 0)
    if (dismissedAt && (now() - dismissedAt) < SOFT_WALL_COOLDOWN_MS) {
      setBannerDismissed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authed])

  const dismissBanner = () => {
    writeInt(SOFT_WALL_KEYS.dismissedAt, now())
    setBannerDismissed(true)
  }

  const { showHardWall, showSoftBanner } = useMemo(() => {
    if (!SOFT_WALL_ENABLED || authed) return { showHardWall: false, showSoftBanner: false }
    if (isExempt(pathname)) return { showHardWall: false, showSoftBanner: false }
    if (!isContentPath(pathname)) return { showHardWall: false, showSoftBanner: false }

    const hardWall = totalViews >= HARD_WALL_THRESHOLD
    const softBanner = !hardWall && rollingViews >= SOFT_BANNER_THRESHOLD && !bannerDismissed

    return { showHardWall: hardWall, showSoftBanner: softBanner }
  }, [authed, pathname, totalViews, rollingViews, bannerDismissed])

  return (
    <div className="relative">
      {children}

      {/* Soft wall - dismissable bottom banner */}
      {showSoftBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 md:pb-4"
          role="region"
          aria-label="Free views limit reached"
        >
          <div className="mx-auto max-w-2xl rounded-t-2xl border border-platerly-border bg-platerly-card/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.45)] px-5 py-4">
            <div className="flex flex-col gap-3 text-platerly-text">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <strong className="text-base font-semibold">
                  You're running low on free views
                </strong>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-platerly-light/10 text-[11px] font-medium ring-1 ring-platerly-border text-platerly-subtle">
                  {rollingViews}/{HARD_WALL_THRESHOLD}
                </span>
              </div>
              <p className="text-sm text-platerly-subtle">
                Create a free Platerly account to unlock unlimited access.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full bg-platerly-green text-white text-sm font-medium shadow hover:bg-platerly-green/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platerly-green/60"
                >
                  Sign up free
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full border border-platerly-border bg-platerly-light/5 text-sm text-platerly-text hover:bg-platerly-green/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platerly-green/60"
                >
                  Log in
                </Link>
                <button
                  onClick={dismissBanner}
                  className="ml-auto px-3 py-1 text-xs text-platerly-subtle hover:text-platerly-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platerly-green/60"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard wall - blocking modal */}
      {showHardWall && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-platerly-light bg-platerly-card p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-2">Create a free account to continue</h3>
            <p className="text-sm text-platerly-subtle mb-4">
              You've reached the guest limit. Log in or create an account to keep exploring recipes and track your allergies.
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="flex-1 text-center rounded-lg bg-platerly-green text-platerly-dark px-3 py-2 font-medium hover:opacity-90"
              >
                Join Platerly
              </Link>
              <Link
                to="/login"
                className="flex-1 text-center rounded-lg bg-white/10 text-white px-3 py-2 font-medium hover:bg-white/15"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SoftWallRoot
