import ReactGA from 'react-ga4'

const isProd = import.meta.env.VITE_ENV === 'production'

function fbq(...args) {
  if (isProd && typeof window.fbq === 'function') {
    window.fbq(...args)
  }
}

/** Fire after successful email or Google registration */
export function trackSignUp(method = 'email') {
  if (!isProd) return
  ReactGA.event('sign_up', { method })
  fbq('track', 'CompleteRegistration', { content_name: 'recipzee_signup', currency: 'USD', value: 0 })
}

/** Fire after trial starts (same moment as sign_up for new users) */
export function trackStartTrial() {
  if (!isProd) return
  ReactGA.event('start_trial')
  fbq('track', 'StartTrial', { value: 0, currency: 'USD', predicted_ltv: 6.99 })
}

/** Fire after Stripe checkout success (premium upgrade) */
export function trackUpgrade(value = 6.99) {
  if (!isProd) return
  ReactGA.event('purchase', { currency: 'USD', value, transaction_id: `rz_${Date.now()}` })
  fbq('track', 'Purchase', { value, currency: 'USD' })
}

/** Fire each time a user runs an allergen scan */
export function trackScan() {
  if (!isProd) return
  ReactGA.event('allergen_scan')
}
