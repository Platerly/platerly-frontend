/**
 * utils/analytics.js — Layer: Utility / Analytics
 *
 * Thin wrappers around GA4 (react-ga4) and the Meta Pixel (window.fbq).
 * All functions are no-ops outside of production to avoid polluting real
 * metrics with developer or staging activity.
 *
 * GA4 measurement ID : G-EV56P4Q9C0 (initialised in main.jsx)
 * Meta Pixel ID      : 1516646546840356 (loaded via index.html <script>)
 *
 * Event mapping:
 *  trackSignUp      → GA4 "sign_up"              + Meta "CompleteRegistration"
 *  trackStartTrial  → GA4 "start_trial"           + Meta "StartTrial"
 *  trackUpgrade     → GA4 "purchase"              + Meta "Purchase"
 *  trackScan        → GA4 "allergen_scan"          (no Meta event — value too low)
 */
import ReactGA from 'react-ga4'
import { getStoredConsent } from '../context/CookieConsentContext'

// Guard: only fire real events when VITE_ENV is explicitly set to 'production'
const isProd = import.meta.env.VITE_ENV === 'production'

const hasAnalyticsConsent = () => getStoredConsent()?.analytics === true
const hasMarketingConsent = () => getStoredConsent()?.marketing === true

/**
 * Calls window.fbq (Meta Pixel) only in production and only when the pixel
 * script has successfully loaded. Silently skips otherwise.
 *
 * @param {...*} args - Arguments forwarded directly to window.fbq()
 */
function fbq(...args) {
  if (isProd && hasMarketingConsent() && typeof window.fbq === 'function') {
    window.fbq(...args)
  }
}

/**
 * Tracks a new user registration.
 * Call immediately after a successful email or Google OAuth sign-up response.
 *
 * GA4 event  : "sign_up"  (standard recommended event)
 *   param method: 'email' | 'google'
 * Meta event : "CompleteRegistration"  value: 0 USD
 *
 * @param {'email'|'google'} method - The registration method used
 */
export function trackSignUp(method = 'email') {
  if (!isProd || !hasAnalyticsConsent()) return
  ReactGA.event('sign_up', { method })
  fbq('track', 'CompleteRegistration', { content_name: 'recipzee_signup', currency: 'USD', value: 0 })
}

/**
 * Tracks the start of a free trial (7-day premium trial granted on registration).
 * Call at the same moment as trackSignUp for new users, since trial begins immediately.
 *
 * GA4 event  : "start_trial"  (standard recommended event)
 * Meta event : "StartTrial"   predicted_ltv: 6.99 USD (expected conversion value)
 */
export function trackStartTrial() {
  if (!isProd || !hasAnalyticsConsent()) return
  ReactGA.event('start_trial')
  fbq('track', 'StartTrial', { value: 0, currency: 'USD', predicted_ltv: 6.99 })
}

/**
 * Tracks a completed Stripe checkout / premium upgrade.
 * Call on the success callback from the Stripe billing flow.
 *
 * GA4 event  : "purchase"  (standard e-commerce event)
 *   param currency: 'USD'
 *   param value: subscription price (default 6.99)
 *   param transaction_id: synthetic ID (rz_ + epoch ms) — not a Stripe ID
 * Meta event : "Purchase"  value + currency forwarded for ROAS reporting
 *
 * @param {number} value - Purchase value in USD (default 6.99 — monthly plan price)
 */
export function trackUpgrade(value = 6.99) {
  if (!isProd || !hasAnalyticsConsent()) return
  ReactGA.event('purchase', { currency: 'USD', value, transaction_id: `rz_${Date.now()}` })
  fbq('track', 'Purchase', { value, currency: 'USD' })
}

/**
 * Tracks a single allergen scan execution.
 * Call after a successful scan response (not on 402 limit-reached errors).
 *
 * GA4 event  : "allergen_scan"  (custom event)
 * Meta event : none (low monetary signal; not worth separate Pixel event)
 */
export function trackScan() {
  if (!isProd || !hasAnalyticsConsent()) return
  ReactGA.event('allergen_scan')
}
