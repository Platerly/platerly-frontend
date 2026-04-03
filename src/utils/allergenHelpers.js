/**
 * utils/allergenHelpers.js — Layer: Utility / Domain logic
 *
 * Pure functions for allergen normalisation, singular/plural variant generation,
 * severity classification, and severity ranking.  These helpers are used across
 * ingredient matching components (RecipeDetailsPage, RecipeCard, PDF export, etc.)
 * to ensure consistent allergen handling throughout the UI.
 *
 * No React dependencies — safe to call from both components and non-React utilities.
 */

/**
 * Normalises a string for reliable comparison: converts to lowercase, trims
 * leading/trailing whitespace, and collapses internal runs of whitespace to a
 * single space.  This prevents false non-matches caused by casing or spacing
 * differences between allergen terms and ingredient names.
 *
 * @param {string} s - The string to normalise
 * @returns {string} Normalised string
 */
export const norm = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

// Explicit form pairs for all supported allergens, covering irregular plurals and
// invariant words that the naive endsWith('s') heuristic handles incorrectly.
// Each entry maps one form to its alternate (both directions are listed).
const ALLERGEN_FORM_MAP = new Map([
  // -es plurals (tomato→tomatoes, potato→potatoes, etc.)
  ['tomato',       'tomatoes'],
  ['tomatoes',     'tomato'],
  ['potato',       'potatoes'],
  ['potatoes',     'potato'],
  ['avocado',      'avocados'],
  ['avocados',     'avocado'],
  ['mango',        'mangoes'],
  ['mangoes',      'mango'],
  ['pistachio',    'pistachios'],
  ['pistachios',   'pistachio'],
  ['anchovy',      'anchovies'],
  ['anchovies',    'anchovy'],
  ['cherry',       'cherries'],
  ['cherries',     'cherry'],
  ['strawberry',   'strawberries'],
  ['strawberries', 'strawberry'],
  ['blueberry',    'blueberries'],
  ['blueberries',  'blueberry'],
  ['raspberry',    'raspberries'],
  ['raspberries',  'raspberry'],
  ['blackberry',   'blackberries'],
  ['blackberries', 'blackberry'],
  // Regular -s plurals for common allergens (belt-and-braces for the heuristic)
  ['egg',      'eggs'],
  ['eggs',     'egg'],
  ['nut',      'nuts'],
  ['nuts',     'nut'],
  ['peanut',   'peanuts'],
  ['peanuts',  'peanut'],
  ['almond',   'almonds'],
  ['almonds',  'almond'],
  ['cashew',   'cashews'],
  ['cashews',  'cashew'],
  ['walnut',   'walnuts'],
  ['walnuts',  'walnut'],
  ['pecan',    'pecans'],
  ['pecans',   'pecan'],
  ['hazelnut', 'hazelnuts'],
  ['hazelnuts','hazelnut'],
  ['shrimp',   'shrimps'],
  ['shrimps',  'shrimp'],
  ['prawn',    'prawns'],
  ['prawns',   'prawn'],
  ['mollusc',  'molluscs'],
  ['molluscs', 'mollusc'],
  ['lupin',    'lupins'],
  ['lupins',   'lupin'],
  ['sulphite', 'sulphites'],
  ['sulphites','sulphite'],
  ['sulfite',  'sulfites'],
  ['sulfites', 'sulfite'],
  ['soybean',  'soybeans'],
  ['soybeans', 'soybean'],
]);

// Words whose singular and plural forms are identical — no variant needed.
const INVARIANT_ALLERGENS = new Set([
  'fish', 'shellfish', 'wheat', 'dairy', 'gluten',
  'sesame', 'soy', 'mustard', 'celery', 'milk',
]);

/**
 * Returns an array containing both singular and plural forms of an allergen
 * word so that "egg" matches "eggs" and "tomatoes" matches "tomato".
 *
 * Strategy (in order):
 *  1. Invariant allergens (fish, shellfish, etc.) — return as-is.
 *  2. Explicit mapping table — covers all irregular forms (tomato↔tomatoes, etc.).
 *  3. Fallback heuristic — standard -s append/strip for unknown words.
 *
 * @param {string} s - The word to expand (will be normalised internally)
 * @returns {string[]} Array of unique variant strings (1 or 2 elements)
 */
export const variants = (s) => {
  const x = norm(s);
  if (!x) return [];
  if (INVARIANT_ALLERGENS.has(x)) return [x];
  const out = new Set([x]);
  const mapped = ALLERGEN_FORM_MAP.get(x);
  if (mapped !== undefined) {
    out.add(mapped);
  } else {
    // Fallback heuristic for unrecognised words
    x.endsWith('s') ? out.add(x.slice(0, -1)) : out.add(`${x}s`);
  }
  return Array.from(out);
};

/**
 * Determines whether a severity level warrants a visual warning in the UI.
 * 'high' and 'medium' both produce warnings; 'low' and unknown values do not.
 *
 * @param {string} s - Severity string (case-insensitive)
 * @returns {boolean} True if the severity is 'high' or 'medium'
 */
export const isSevere = (s) => ['high', 'medium'].includes(String(s || '').toLowerCase());

/**
 * Maps a severity string to a numeric rank for sorting purposes.
 * Higher numbers sort first (descending order = most severe first).
 *
 *   'high'   → 3
 *   'medium' → 2
 *   'low'    → 1
 *   unknown  → 0
 *
 * @param {string} s - Severity string
 * @returns {number} Numeric rank (0–3)
 */
export const sevRank = (s) => (s === 'high' ? 3 : s === 'medium' ? 2 : s === 'low' ? 1 : 0);
