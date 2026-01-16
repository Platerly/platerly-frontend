// src/utils/formatDate.js

/**
 * Formats a date for display.
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or "—" if invalid
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '—'

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)

  if (isNaN(date.getTime())) return '—'

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return date.toLocaleDateString(undefined, defaultOptions)
}

/**
 * Formats a date with time.
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null
 * @returns {string} Formatted date/time string or "—" if invalid
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
 * Returns a relative time string (e.g., "2 hours ago", "3 days ago").
 *
 * @param {string|Date|null} dateInput - ISO date string, Date object, or null
 * @returns {string} Relative time string or "—" if invalid
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
 * Formats minutes as hours and minutes.
 *
 * @param {number|null} minutes - Total minutes
 * @returns {string|null} Formatted time or null if invalid
 */
export function formatMinutes(minutes) {
  if (minutes == null || typeof minutes !== 'number') return null

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}
