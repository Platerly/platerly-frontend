/**
 * utils/formatDate.js — Layer: Utility / Formatting
 *
 * Date and time formatting helpers used throughout the UI.
 * All functions accept either an ISO date string or a Date object and return a
 * locale-appropriate string via the browser's Intl APIs.  Invalid or missing
 * inputs consistently return "—" (an em-dash) so callers never see "Invalid Date".
 *
 * Functions:
 *  formatDate         — Short date (e.g. "Mar 31, 2026")
 *  formatDateTime     — Date + time (e.g. "Mar 31, 2026, 9:45 AM")
 *  formatRelativeTime — Human relative time (e.g. "2h ago", "3d ago")
 *  formatMinutes      — Minute count to readable duration (e.g. "1 hr 30 min")
 */

/**
 * Formats a date for display using the user's locale.
 * Defaults to "Mar 31, 2026" style (month:short); callers can override via options.
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null/undefined
 * @param {Intl.DateTimeFormatOptions} options - Override or extend the default Intl options
 * @returns {string} Formatted date string, or "—" if the input is absent or invalid
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '—'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  // Reject dates that couldn't be parsed (NaN getTime)
  if (isNaN(date.getTime())) return '—'

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options, // caller overrides win, including locale-specific formats
  }

  return date.toLocaleDateString(undefined, defaultOptions)
}

/**
 * Formats a date together with its time component.
 * Produces output like "Mar 31, 2026, 9:45 AM" in the user's locale.
 * Used for precise timestamps (e.g. audit logs, notification timestamps).
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null/undefined
 * @returns {string} Formatted date/time string, or "—" if absent or invalid
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  if (isNaN(date.getTime())) return '—'

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Returns a compact relative-time string appropriate for feed timestamps and
 * notification lists (e.g. "just now", "5m ago", "2h ago", "3d ago").
 *
 * Thresholds (cascading):
 *  < 60 s   → "just now"
 *  < 60 min → "Xm ago"
 *  < 24 h   → "Xh ago"
 *  < 7 d    → "Xd ago"
 *  < 4 wk   → "Xw ago"
 *  < 12 mo  → "Xmo ago"
 *  else     → "Xy ago"
 *
 * Note: month/year conversions use approximate divisors (30 days/month,
 * 365 days/year) — sufficient for display purposes but not calendar-accurate.
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null/undefined
 * @returns {string} Relative time string, or "—" if absent or invalid
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  if (isNaN(date.getTime())) return '—'

  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  return `${diffYears}y ago`
}

/**
 * Converts a raw minute count into a human-readable duration string.
 * Used for recipe prep/cook/total time fields (e.g. 90 → "1 hr 30 min").
 *
 * Returns null (not "—") so callers can conditionally omit the field entirely
 * rather than displaying a placeholder.
 *
 * @param {number|null} minutes - Total duration in minutes
 * @returns {string|null} Formatted duration string, or null if input is absent or not a number
 */
export function formatMinutes(minutes) {
  if (minutes == null || typeof minutes !== 'number') return null

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  // Show both components only when both are non-zero
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}
