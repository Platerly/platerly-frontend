/**
 * Allergen-related utility functions for ingredient matching and severity display.
 * These functions are used across multiple components for consistent allergen handling.
 */

/**
 * Normalizes a string for comparison: lowercase, trim, collapse whitespace.
 * @param {string} s - The string to normalize
 * @returns {string} Normalized string
 */
export const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Returns an array of singular/plural variants for matching.
 * @param {string} s - The word to get variants for
 * @returns {string[]} Array of variants (original + singular/plural)
 */
export const variants = (s) => {
  const x = norm(s);
  if (!x) return [];
  const out = new Set([x]);
  x.endsWith('s') ? out.add(x.slice(0, -1)) : out.add(`${x}s`);
  return Array.from(out);
};

/**
 * Checks if a severity level is considered severe (high or medium).
 * @param {string} s - The severity level
 * @returns {boolean} True if severity is high or medium
 */
export const isSevere = (s) => ['high', 'medium'].includes(String(s || '').toLowerCase());

/**
 * Converts severity string to numeric rank for comparison.
 * @param {string} s - The severity level (high, medium, low)
 * @returns {number} Numeric rank (3=high, 2=medium, 1=low, 0=unknown)
 */
export const sevRank = (s) => (s === 'high' ? 3 : s === 'medium' ? 2 : s === 'low' ? 1 : 0);
