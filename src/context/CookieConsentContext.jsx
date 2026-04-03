/**
 * CookieConsentContext — Cookie consent state + tracking side-effects.
 *
 * Responsibilities:
 *  - Reads stored consent from localStorage on mount
 *  - Shows the bottom consent banner when no decision has been recorded
 *  - Exposes `openManage()` so the footer and other surfaces can open the
 *    manage-cookies modal without the banner being visible
 *  - Activates GA4 and Meta Pixel only once, and only when the respective
 *    consent category is granted
 *
 * Consent categories:
 *  essential    — Auth tokens, CSRF, session state. Always true; cannot be rejected.
 *  analytics    — Google Analytics 4 (GA4) — pageviews and custom events.
 *  marketing    — Meta Pixel — conversion tracking and ad performance.
 *  preferences  — Local-storage preference caches (quota, subscription status).
 *                 Not third-party tracking; default true.
 *
 * Storage:
 *  localStorage key `rz_cookie_consent_v1`
 *  { essential, analytics, marketing, preferences, decidedAt, version }
 *  Consent expires after 365 days; banner reappears and tracking stops.
 *
 * Usage:
 *  const { consent, openManage } = useCookieConsent()
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import ReactGA from 'react-ga4'

// ── Storage ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'rz_cookie_consent_v1'
const EXPIRY_DAYS = 365

export const DEFAULT_CONSENT = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: true,
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.decidedAt) {
      const age = Date.now() - new Date(parsed.decidedAt).getTime()
      if (age > EXPIRY_DAYS * 86_400_000) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

function writeConsent(prefs) {
  const data = {
    ...DEFAULT_CONSENT,
    ...prefs,
    essential: true,          // essential can never be false
    decidedAt: new Date().toISOString(),
    version: 1,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

// ── Tracking bootstrap helpers ────────────────────────────────────────────────
let ga4Initialised = false
function enableGA4() {
  if (ga4Initialised) return
  const id = import.meta.env.VITE_GA_ID
  if (!id || import.meta.env.VITE_ENV !== 'production') return
  ReactGA.initialize(id)
  ReactGA.send('pageview')
  ga4Initialised = true
}

let pixelLoaded = false
function enableMetaPixel() {
  if (pixelLoaded) return
  if (import.meta.env.VITE_ENV !== 'production') return
  // Dynamically inject the Meta Pixel SDK and initialise
  /* eslint-disable */
  ;(function(f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
    if (!f._fbq) f._fbq = n
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
    t = b.createElement(e); t.async = true; t.src = v
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */
  window.fbq('init', '1516646546840356')
  window.fbq('track', 'PageView')
  pixelLoaded = true
}

// ── Context ───────────────────────────────────────────────────────────────────
const CookieConsentContext = createContext(null)

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readStored())
  const [showBanner, setShowBanner] = useState(() => readStored() === null)
  const [manageOpen, setManageOpen] = useState(false)

  // Apply tracking side-effects whenever consent changes
  useEffect(() => {
    if (!consent) return
    if (consent.analytics) enableGA4()
    if (consent.marketing) enableMetaPixel()
  }, [consent?.analytics, consent?.marketing])

  const acceptAll = useCallback(() => {
    const data = writeConsent({ analytics: true, marketing: true, preferences: true })
    setConsent(data)
    setShowBanner(false)
    setManageOpen(false)
  }, [])

  const rejectAll = useCallback(() => {
    const data = writeConsent({ analytics: false, marketing: false, preferences: true })
    setConsent(data)
    setShowBanner(false)
    setManageOpen(false)
  }, [])

  const savePreferences = useCallback((prefs) => {
    const data = writeConsent(prefs)
    setConsent(data)
    setShowBanner(false)
    setManageOpen(false)
  }, [])

  const openManage = useCallback(() => setManageOpen(true), [])
  const closeManage = useCallback(() => setManageOpen(false), [])

  return (
    <CookieConsentContext.Provider
      value={{ consent, showBanner, manageOpen, acceptAll, rejectAll, savePreferences, openManage, closeManage }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider')
  return ctx
}

/**
 * Lightweight read-only accessor that works outside the provider tree
 * (e.g., in analytics.js at module level).
 */
export function getStoredConsent() {
  return readStored()
}
