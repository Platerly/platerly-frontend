// src/components/ui/TrialExpiryBanner.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { usePremium } from '../../hooks/usePremium'

const TRIAL_DAY8_KEY = 'pl_trial_day8_shown'

/**
 * Shows:
 * - Day 7 (trialDaysRemaining <= 1 and isOnTrial): persistent gold banner (dismissable per-session)
 * - Day 8+ (trial ended within 7 days, not premium): one-time modal (never shows again)
 */
export default function TrialExpiryBanner() {
  const { isPremium, isOnTrial, trialDaysRemaining, trialEndsAt, loading } = usePremium()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const [day8AlreadyShown] = useState(() => {
    try { return localStorage.getItem(TRIAL_DAY8_KEY) === '1' } catch { return true }
  })

  const dismissModal = () => {
    setModalDismissed(true)
    try { localStorage.setItem(TRIAL_DAY8_KEY, '1') } catch { /* ignore */ }
  }

  if (loading || isPremium) return null

  // Day 8 modal: trial ended within 7 days, not on trial, not premium
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null
  const daysSinceTrialEnd = trialEndDate
    ? (Date.now() - trialEndDate.getTime()) / (1000 * 60 * 60 * 24)
    : null

  const showDay8Modal =
    !isOnTrial &&
    !isPremium &&
    !day8AlreadyShown &&
    !modalDismissed &&
    daysSinceTrialEnd !== null &&
    daysSinceTrialEnd >= 0 &&
    daysSinceTrialEnd <= 7

  // Day 7 banner: on trial, 1 day or less remaining
  const showEndingBanner =
    isOnTrial &&
    trialDaysRemaining !== null &&
    trialDaysRemaining <= 1 &&
    !bannerDismissed

  if (showDay8Modal) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={dismissModal} />
        {/* Modal */}
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-96 rounded-2xl bg-recipzee-card border border-recipzee-border shadow-2xl p-6 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-recipzee-text mb-1">Your free trial has ended</p>
            <p className="text-sm text-recipzee-muted">
              You now have 3 free allergen scans per week. Upgrade to keep unlimited access.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/settings?tab=subscription"
              onClick={dismissModal}
              className="w-full text-center px-4 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-colors"
            >
              Upgrade for $6.99/mo
            </Link>
            <button
              onClick={dismissModal}
              className="w-full text-center px-4 py-2 rounded-xl border border-recipzee-border text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light transition-colors text-sm"
            >
              Not now
            </button>
          </div>
        </div>
      </>
    )
  }

  if (showEndingBanner) {
    return (
      <div className="w-full bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-sm text-yellow-200 flex-1">
          Your free trial ends tomorrow. Upgrade to keep unlimited allergen breakdowns.{' '}
          <Link
            to="/settings?tab=subscription"
            className="font-semibold text-yellow-400 hover:text-yellow-300 underline-offset-2 underline"
          >
            Upgrade →
          </Link>
        </p>
        <button
          onClick={() => setBannerDismissed(true)}
          className="shrink-0 text-yellow-400/70 hover:text-yellow-400 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return null
}
