/**
 * ScanCounter.jsx — Weekly allergen scan quota indicator for free users.
 *
 * Layer: UI / tier indicator.
 *
 * Reads scan status from `useScanStatus` (cache key `pl_scan_status_v1`, 2-min TTL).
 * Returns null for premium users (no quota), while loading, or when scansLimit is
 * not yet known.
 *
 * Colour progression (tied to `scansRemaining`):
 *   - 2–3 remaining (≥ 2): green  — plenty of scans left
 *   - 1 remaining       (= 1): amber  — one scan left, gentle warning
 *   - 0 / at limit      (= 0): red    — all scans used
 *
 * When `atLimit` is true (0 remaining), an "Upgrade" link to the subscription
 * settings page is appended so the user can immediately act on the prompt.
 *
 * @returns {JSX.Element|null}
 */
// src/components/ui/ScanCounter.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useScanStatus } from '../../hooks/useScanStatus'

/**
 * Displays the user's weekly allergen scan quota.
 * Returns null for premium users or while loading.
 */
export default function ScanCounter() {
  const { scansRemaining, scansLimit, weekResetsAt, isPremium, atLimit, loading } = useScanStatus()

  if (loading || isPremium || scansLimit === null) return null

  const resetDate = weekResetsAt
    ? new Date(weekResetsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'next Monday'

  // At-limit state: red text + upgrade link replace the normal counter
  if (atLimit) {
    return (
      <div className="text-xs text-recipzee-text/70 flex items-center gap-1.5">
        <span className="text-red-400">Allergen scans used up · resets {resetDate}</span>
        {/* Upgrade link appears only when the user has hit their limit */}
        <Link
          to="/settings?tab=subscription"
          className="text-yellow-400 font-medium hover:text-yellow-300 underline-offset-2 underline"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  // Colour progression: green (0-1 scans used) → amber (1 left) → red (0 left / at limit)
  const colorClass =
    scansRemaining >= 2
      ? 'text-emerald-400'    // 2+ remaining: green
      : scansRemaining === 1
        ? 'text-amber-400'    // 1 remaining: amber warning
        : 'text-red-400'      // 0 remaining: red (edge case — atLimit guard above catches most)

  return (
    <span className={`text-xs ${colorClass}`}>
      {scansRemaining} allergen scan{scansRemaining !== 1 ? 's' : ''} left this week
    </span>
  )
}
