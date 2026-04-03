/**
 * ManageCookiesModal — Granular cookie preference manager.
 *
 * Displays one toggle row per consent category:
 *  Essential     — Always on; toggle disabled (required for the app to function).
 *  Analytics     — GA4 pageviews and custom events.
 *  Marketing     — Meta Pixel conversion tracking and ad performance.
 *  Preferences   — Local-storage caches (subscription status, scan quota, filter state).
 *
 * Opened from CookieConsentBanner ("Manage cookies" link) and from the
 * site footer ("Manage Cookies" button).
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ShieldCheck, BarChart2, Megaphone, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useCookieConsent, DEFAULT_CONSENT } from '../../context/CookieConsentContext'

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false, id }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full',
        'border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-recipzee-green focus-visible:ring-offset-2 focus-visible:ring-offset-recipzee-card',
        disabled
          ? 'bg-recipzee-border cursor-not-allowed opacity-60'
          : checked
          ? 'bg-recipzee-green'
          : 'bg-recipzee-border',
      ].join(' ')}
      aria-label={disabled ? 'Always active' : (checked ? 'Enabled' : 'Disabled')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ── Category row ──────────────────────────────────────────────────────────────
function CategoryRow({ icon: Icon, title, description, details, checked, onChange, disabled, id }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-recipzee-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 px-4 py-4 bg-white/[0.02]">
        <Icon className="w-5 h-5 text-recipzee-muted flex-shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor={id}
              className={`text-sm font-semibold ${disabled ? 'text-recipzee-muted' : 'text-recipzee-text'} cursor-pointer`}
            >
              {title}
            </label>
            <div className="flex items-center gap-3 flex-shrink-0">
              {disabled && (
                <span className="text-xs text-recipzee-muted bg-recipzee-border/50 px-2 py-0.5 rounded-full">
                  Always active
                </span>
              )}
              <Toggle checked={checked} onChange={onChange} disabled={disabled} id={id} />
            </div>
          </div>
          <p className="text-xs text-recipzee-muted mt-1 leading-relaxed pr-2">{description}</p>
          {details && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-2 text-xs text-recipzee-subtle hover:text-recipzee-text transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Show less' : 'Show details'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && details && (
        <div className="px-4 pb-4 pt-2 bg-white/[0.015] border-t border-recipzee-border/50">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            {Object.entries(details).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-recipzee-muted font-medium">{k}</dt>
                <dd className="text-recipzee-subtle">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function ManageCookiesModal({ onClose }) {
  const { consent, savePreferences } = useCookieConsent()

  const [prefs, setPrefs] = useState({
    essential: true,
    analytics: consent?.analytics ?? DEFAULT_CONSENT.analytics,
    marketing: consent?.marketing ?? DEFAULT_CONSENT.marketing,
    preferences: consent?.preferences ?? DEFAULT_CONSENT.preferences,
  })

  const set = (key) => (val) => setPrefs(p => ({ ...p, [key]: val }))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-cookies-title"
        className="fixed z-[9200] inset-x-4 bottom-4 sm:inset-auto sm:right-6 sm:bottom-6
                   sm:w-[480px] max-h-[85vh] flex flex-col
                   bg-recipzee-card border border-recipzee-border
                   rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]
                   overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-recipzee-border bg-white/[0.02] flex-shrink-0">
          <h2 id="manage-cookies-title" className="text-base font-semibold text-recipzee-text">
            Manage Cookie Preferences
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <p className="text-xs text-recipzee-muted leading-relaxed">
            Choose which cookies Recipzee may use. Essential cookies keep the app working and cannot be disabled.
            You can change these settings at any time from the footer.
            See our{' '}
            <Link
              to="/cookie-policy"
              className="text-recipzee-green hover:underline underline-offset-2"
              onClick={onClose}
            >
              Cookie Policy
            </Link>{' '}
            for full details.
          </p>

          <CategoryRow
            id="cookie-essential"
            icon={ShieldCheck}
            title="Essential"
            description="Required for core functionality: authentication sessions, security tokens, and basic app state. Cannot be disabled."
            checked={true}
            onChange={() => {}}
            disabled
            details={{
              'What is stored': 'Auth JWT token (localStorage), session flags, CSRF state',
              'Expires': 'Session / up to 7 days (JWT lifetime)',
              'Third parties': 'None',
            }}
          />

          <CategoryRow
            id="cookie-analytics"
            icon={BarChart2}
            title="Analytics"
            description="Helps us understand how visitors use Recipzee so we can improve features and performance. Data is pseudonymised and aggregated."
            checked={prefs.analytics}
            onChange={set('analytics')}
            details={{
              'Provider': 'Google Analytics 4 (GA4) — Google LLC',
              'Measurement ID': 'G-EV56P4Q9C0',
              'Data collected': 'Pages visited, session duration, events (sign-up, trial start, scan)',
              'Retention': '26 months (Google default)',
              'Opt out': 'Reject cookies here, or install the GA Opt-out browser add-on',
            }}
          />

          <CategoryRow
            id="cookie-marketing"
            icon={Megaphone}
            title="Marketing"
            description="Measures the effectiveness of our advertising and enables relevant ad targeting on third-party platforms. Disabled by default."
            checked={prefs.marketing}
            onChange={set('marketing')}
            details={{
              'Provider': 'Meta Platforms Ireland Ltd (Meta Pixel)',
              'Pixel ID': '1516646546840356',
              'Data collected': 'Page views, registration completions, purchase events (aggregated)',
              'Retention': 'Governed by Meta\'s data policy',
              'Opt out': 'Reject cookies here, or visit facebook.com/ads/preferences',
            }}
          />

          <CategoryRow
            id="cookie-preferences"
            icon={Settings2}
            title="Preferences"
            description="Stores your settings in your browser so we don't have to re-fetch them on every visit. This is convenience caching, not third-party tracking."
            checked={prefs.preferences}
            onChange={set('preferences')}
            details={{
              'What is stored': 'Subscription status, scan quota, allergen filter state, UI settings',
              'Storage type': 'localStorage (browser only — never sent to third parties)',
              'Expires': '2–30 minutes per cache key (auto-invalidated)',
              'Third parties': 'None',
            }}
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-recipzee-border bg-white/[0.02] flex-shrink-0">
          <button
            onClick={() => savePreferences(prefs)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                       bg-recipzee-green text-recipzee-dark hover:opacity-90 transition-opacity"
          >
            Save preferences
          </button>
          <button
            onClick={() => { setPrefs({ essential: true, analytics: true, marketing: true, preferences: true }); savePreferences({ essential: true, analytics: true, marketing: true, preferences: true }) }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium
                       border border-recipzee-border bg-white/5
                       text-recipzee-subtle hover:text-recipzee-text hover:bg-white/10
                       transition-colors whitespace-nowrap"
          >
            Accept all
          </button>
        </div>
      </div>
    </>
  )
}
