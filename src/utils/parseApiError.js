/**
 * Parses API error responses and returns a user-friendly error object.
 * Handles special cases like prohibited ingredients violations.
 */
export function parseApiError(responseText) {
  if (!responseText) {
    return { message: 'Something went wrong. Please try again.', violations: null }
  }

  // Try to parse as JSON
  let parsed = null
  try {
    parsed = JSON.parse(responseText)
  } catch {
    // Not JSON, return as plain message
    return { message: responseText, violations: null }
  }

  // Check for prohibited ingredients response
  if (parsed.violations && Array.isArray(parsed.violations)) {
    return {
      message: parsed.message || 'Recipe contains prohibited ingredients',
      violations: parsed.violations,
      type: 'prohibited_ingredients'
    }
  }

  // Standard error object
  if (parsed.message) {
    return { message: parsed.message, violations: null }
  }

  if (parsed.error) {
    return { message: parsed.error, violations: null }
  }

  // Fallback
  return { message: 'Something went wrong. Please try again.', violations: null }
}

/**
 * Formats a prohibited ingredient violation for display
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
    category: categoryLabels[violation.category] || violation.category,
    reason: violation.reason
  }
}
