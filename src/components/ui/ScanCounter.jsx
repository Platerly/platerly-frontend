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

  if (atLimit) {
    return (
      <div className="text-xs text-recipzee-text/70 flex items-center gap-1.5">
        <span className="text-red-400">Allergen scans used up · resets {resetDate}</span>
        <Link
          to="/settings?tab=subscription"
          className="text-yellow-400 font-medium hover:text-yellow-300 underline-offset-2 underline"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  const colorClass =
    scansRemaining >= 2
      ? 'text-emerald-400'
      : scansRemaining === 1
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <span className={`text-xs ${colorClass}`}>
      {scansRemaining} allergen scan{scansRemaining !== 1 ? 's' : ''} left this week
    </span>
  )
}
