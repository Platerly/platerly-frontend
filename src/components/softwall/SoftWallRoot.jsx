// src/components/softwall/SoftWallRoot.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* ---------- LocalStorage keys ---------- */
const LS = {
  guestSeenCount: 'pl_guest_seen_count_v1',
}

/* ---------- Helpers (no hooks) ---------- */
const readInt = (k, d = 0) => {
  try { const n = parseInt(localStorage.getItem(k) || '', 10); return Number.isFinite(n) ? n : d } catch { return d }
}
const writeInt = (k, v) => { try { localStorage.setItem(k, String(v)) } catch {} }

/* ---------- Behavior ---------- */
const VIEW_THRESHOLD = 10

// Only these paths COUNT toward the wall and can SHOW it.
// Everything else (including "/") is implicitly EXEMPT.
const CONTENT_ALLOWLIST = [
  '/feed',
  '/explore',
  '/chefs',
  '/recipe',        // covers /recipe/:id
  '/cookbooks',
  '/profile',       // covers /profile/:username
  '/tags',          // covers /tags/:tag
]

const AUTH_PAGES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
]

const LEGAL_PAGES = [
  '/privacy',
  '/terms',
]

const startsWithAny = (pathname, list) =>
  list.some(p => pathname === p || pathname.startsWith(p + '/'))

const isAuthOrLegal = (pathname) =>
  startsWithAny(pathname, AUTH_PAGES) || startsWithAny(pathname, LEGAL_PAGES)

// Count/show only on allowed content pages
const isContentPath = (pathname) => startsWithAny(pathname, CONTENT_ALLOWLIST)

/**
 * Hard wall:
 * - Counts guest views only on content routes (allow-list)
 * - Shows wall only on content routes
 * - Never shows on landing "/" or on auth/legal pages
 */
const SoftWallRoot = ({ children }) => {
  const { authed } = useAuth()
  const location = useLocation()
  const { pathname } = location

  const [guestSeenCount, setGuestSeenCount] = useState(() => readInt(LS.guestSeenCount, 0))

  // Increment only for guests on content routes
  useEffect(() => {
    if (authed) return
    if (!isContentPath(pathname)) return
    const next = guestSeenCount + 1
    setGuestSeenCount(next)
    writeInt(LS.guestSeenCount, next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const shouldShow = useMemo(() => {
    if (authed) return false
    if (isAuthOrLegal(pathname)) return false
    if (!isContentPath(pathname)) return false
    return guestSeenCount >= VIEW_THRESHOLD
  }, [authed, pathname, guestSeenCount])

  return (
    <div className="relative">
      {children}

      {shouldShow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-platerly-light bg-platerly-card p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-2">Create a free account to continue</h3>
            <p className="text-sm text-platerly-subtle mb-4">
              You’ve reached the guest limit. Log in or create an account to keep exploring recipes.
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
