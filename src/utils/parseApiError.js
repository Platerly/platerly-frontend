/**
 * utils/parseApiError.js — Layer: Utility / Error handling
 *
 * Normalises raw API error responses (which may be JSON objects, plain text, or
 * empty) into a consistent shape that UI components can display without needing
 * to know the server's response format.
 *
 * Returned error shape:
 *  {
 *    message: string,             — Human-readable error message
 *    violations: Array|null,      — Populated only for prohibited-ingredient errors
 *    type?: 'prohibited_ingredients'  — Present only for that specific error class
 *  }
 *
 * Special-cased error types:
 *  - Prohibited ingredient violations: the backend returns { message, violations: [...] }.
 *    These are surfaced as type: 'prohibited_ingredients' with the violations array intact
 *    so the UI can render a detailed list of which ingredients were blocked and why.
 */

/**
 * Parses a raw API response body string into a normalised error object.
 *
 * Precedence for extracting the message (once JSON is parsed):
 *  1. violations array detected → treat as prohibited-ingredient error
 *  2. parsed.message field
 *  3. parsed.error field
 *  4. Generic fallback message
 *
 * @param {string|null|undefined} responseText - Raw response body as a string
 * @returns {{ message: string, violations: Array|null, type?: string }}
 */
export function parseApiError(responseText) {
  if (!responseText) {
    return { message: 'Something went wrong. Please try again.', violations: null }
  }

  // Attempt to parse as JSON; if it fails, treat the raw text as the message
  let parsed = null
  try {
    parsed = JSON.parse(responseText)
  } catch {
    // Not JSON, return as plain message
    return { message: responseText, violations: null }
  }

  // Special case: prohibited ingredients response includes a violations array
  // with per-ingredient details (ingredient name, category, reason).
  // The type field allows consuming components to render a richer error UI.
  if (parsed.violations && Array.isArray(parsed.violations)) {
    return {
      message: parsed.message || 'Recipe contains prohibited ingredients',
      violations: parsed.violations,
      type: 'prohibited_ingredients'
    }
  }

  // Standard error object with a message field (most backend 4xx/5xx responses)
  if (parsed.message) {
    return { message: parsed.message, violations: null }
  }

  // Some endpoints use 'error' instead of 'message'
  if (parsed.error) {
    return { message: parsed.error, violations: null }
  }

  // Fallback when JSON was valid but contained no recognised error fields
  return { message: 'Something went wrong. Please try again.', violations: null }
}

/**
 * Maps a raw violation object from the prohibited-ingredients API response
 * to a display-ready shape with human-friendly category labels.
 *
 * Category label mapping:
 *  Haram    → "Not Halal"
 *  Dangerous → "Dangerous"
 *  Illegal  → "Illegal"
 *  Harmful  → "Harmful"
 *  Offensive → "Not Allowed"
 *  (other)  → raw category value (passthrough for future categories)
 *
 * @param {{ ingredient: string, category: string, reason: string }} violation
 * @returns {{ ingredient: string, category: string, reason: string }}
 */
export function formatViolation(violation) {
  const categoryLabels = {
    Haram: 'Not Halal',
    Dangerous: 'Dangerous',
    Illegal: 'Illegal',
    Harmful: 'Harmful',
    Offensive: 'Not Allowed'
  }

  return {
    ingredient: violation.ingredient,
    // Use the mapped label if known; fall back to the raw value for unknown categories
    category: categoryLabels[violation.category] || violation.category,
    reason: violation.reason
  }
}
