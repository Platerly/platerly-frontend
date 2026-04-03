/**
 * constants/limits.js — Layer: Config / UI and validation constants
 *
 * Central registry of numeric limits used across the application.
 * Grouping them here avoids magic numbers scattered throughout components
 * and makes it easy to adjust thresholds in one place.
 *
 * Categories:
 *  - UI Breakpoints      : CSS-equivalent pixel thresholds for responsive logic
 *  - Form Validation     : Maximum/minimum character counts for user-editable fields
 *  - Pagination          : Page sizes for different list types
 *  - UI Display Limits   : How many items to show before truncating
 *  - Timing              : Delay constants for debounce, toast, and auto-save
 *  - File Upload         : Size and MIME type restrictions
 */

// ── UI Breakpoints ────────────────────────────────────────────────────────────
// Used in JavaScript-driven responsive logic (e.g. conditional rendering).
// Keep in sync with Tailwind config breakpoints where applicable.
export const MOBILE_BREAKPOINT = 420;   // px — below this: mobile layout
export const TABLET_BREAKPOINT = 768;   // px — below this: tablet layout
export const DESKTOP_BREAKPOINT = 1024; // px — at or above: full desktop layout

// ── Form Validation Limits ────────────────────────────────────────────────────
// Enforced client-side in forms and also mirrored by backend model validators.
export const BIO_MAX_LENGTH = 500;              // User profile bio
export const USERNAME_MIN_LENGTH = 3;           // Shortest allowed username
export const USERNAME_MAX_LENGTH = 30;          // Longest allowed username
export const PASSWORD_MIN_LENGTH = 8;           // Minimum password length
export const DISPLAY_NAME_MAX_LENGTH = 50;      // Full / display name field
export const RECIPE_TITLE_MAX_LENGTH = 160;     // Recipe title (generous for SEO)
export const RECIPE_DESCRIPTION_MAX_LENGTH = 4000; // Recipe description / notes

// ── Pagination ────────────────────────────────────────────────────────────────
// Page sizes passed as query params to list endpoints.
export const DEFAULT_PAGE_SIZE = 12;  // Generic fallback (cookbooks, collections)
export const FEED_PAGE_SIZE = 30;     // Social feed — larger page to reduce scrolling interruptions
export const SEARCH_PAGE_SIZE = 20;   // Search results — balanced between load time and density

// ── UI Display Limits ─────────────────────────────────────────────────────────
// Controls truncation in card and summary views before showing "+N more" patterns.
export const TAGS_INLINE_MAX = 2;             // Tags shown inline on a recipe card before overflow
export const MAX_VISIBLE_CONTRIBUTORS = 5;    // Cookbook contributor avatars shown before "+N"

// ── Timing (milliseconds) ─────────────────────────────────────────────────────
export const DEBOUNCE_DELAY = 300;    // Keystroke debounce for search inputs
export const TOAST_DURATION = 3000;   // Duration react-hot-toast notifications stay visible
export const AUTO_SAVE_DELAY = 1000;  // Delay before triggering an auto-save after the last edit

// ── File Upload Limits ────────────────────────────────────────────────────────
export const MAX_IMAGE_SIZE_BYTES = 8_000_000; // 8 MB — maximum size for recipe / avatar images
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
