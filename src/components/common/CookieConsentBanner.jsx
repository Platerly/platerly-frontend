/**
 * CookieConsentBanner — Fixed bottom cookie consent bar.
 *
 * Mirrors the pattern used by Stripe and other industry-standard implementations:
 *  - Appears at the bottom of the viewport on first visit
 *  - Offers "Accept all" and "Reject all" as primary actions
 *  - Links to the full Cookie Policy page (/cookie-policy)
 *  - Links to the Manage Cookies modal for granular control
 *  - Dismissed permanently once a choice is made (stored for 365 days)
 *
 * Rendered by CookieConsentProvider inside main.jsx — always mounted so the
 * ManageCookiesModal can be triggered from the footer independently.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { X, Cookie } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import ManageCookiesModal from './ManageCookiesModal'

export default function CookieConsentBanner() {
  const { showBanner, manageOpen, acceptAll, rejectAll, openManage, closeManage } = useCookieConsent()

  return (
    <>
      {/* ── Bottom consent bar ── */}
      {showBanner && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-[9000]
                     bg-recipzee-card/95 backdrop-blur-md
                     border-t border-recipzee-border
                     shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        >
          {/* Safe-area padding for mobile home-bar */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4
                          pb-[calc(1rem+env(safe-area-inset-bottom))]
                          flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">

            {/* Icon + text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie className="w-5 h-5 text-recipzee-green flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-recipzee-text leading-relaxed">
                We use cookies to improve your experience and for marketing and analytics.{' '}
                <Link
                  to="/cookie-policy"
                  className="text-recipzee-green underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  Cookie policy
                </Link>
                {' '}or{' '}
                <button
                  onClick={openManage}
                  className="text-recipzee-green underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap bg-transparent border-0 p-0 cursor-pointer text-sm font-inherit"
                >
                  Manage cookies
                </button>
                .
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={rejectAll}
                className="px-4 py-2 rounded-xl text-sm font-medium
                           border border-recipzee-border bg-white/5
                           text-recipzee-text hover:bg-white/10
                           transition-colors whitespace-nowrap"
              >
                Reject all
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 rounded-xl text-sm font-semibold
                           bg-recipzee-green text-recipzee-dark
                           hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage cookies modal (accessible from footer too) ── */}
      {manageOpen && <ManageCookiesModal onClose={closeManage} />}
    </>
  )
}
