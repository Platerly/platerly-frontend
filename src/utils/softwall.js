/**
 * utils/softwall.js — Layer: Utility / Guest engagement gating
 *
 * Manages the localStorage state that drives the soft paywall shown to
 * unauthenticated (guest) visitors.  The soft wall is a sign-up prompt
 * that appears after a guest has browsed enough content to demonstrate intent,
 * without completely blocking access the way a hard paywall would.
 *
 * Storage keys used:
 *  pl_guest_seen_count_v1   — Running integer count of content items viewed
 *  pl_soft_wall_shown_at_v1 — Timestamp (ms) of the last time the wall was shown
 *
 * The config/softWall.js file defines the thresholds and cooldown periods that
 * determine when the wall triggers (SOFT_WALL_DAILY_LIMIT, SOFT_WALL_COOLDOWN_MS, etc.).
 */

// localStorage key for the count of content items viewed by a guest
const COUNT_KEY = 'pl_guest_seen_count_v1';
// localStorage key for the timestamp when the soft wall was last displayed
const SHOWN_AT_KEY = 'pl_soft_wall_shown_at_v1';

/**
 * Increments the guest "seen count" in localStorage to track content exposure.
 * Must be called on every meaningful content view (e.g. a recipe card rendered).
 *
 * Behaviour:
 *  - If the auth state is still loading, returns immediately to avoid acting on
 *    stale auth information (prevents false guest counts for real users).
 *  - If the user is authenticated, removes any existing guest counters to clean
 *    up state left over from a previous anonymous session.
 *  - If the user is a guest, increments the count by 1.  The soft wall component
 *    reads this value and triggers the sign-up prompt when the threshold is reached.
 *
 * @param {{ authed: boolean, loading: boolean }} param0
 *   authed  — true when a valid session exists (from AuthContext)
 *   loading — true while AuthContext is still bootstrapping (token check / refresh in progress)
 */
export function bumpGuestSeenCount({ authed, loading }) {
  if (loading) return; // wait for AuthContext
  if (authed) {
    // logged in → ensure guest artifacts are gone
    try {
      localStorage.removeItem(COUNT_KEY);
      localStorage.removeItem(SHOWN_AT_KEY);
    } catch { /* ignore */ }
    return;
  }
  // Guest: parse existing count (default 0) and increment by 1
  try {
    const cur = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0;
    localStorage.setItem(COUNT_KEY, String(cur + 1));
  } catch { /* ignore */ }
}

/**
 * Resets all soft wall localStorage state.
 * Call this after the user signs up or logs in so the wall does not re-appear
 * immediately if they later log out and return as a guest.
 * Also called internally by bumpGuestSeenCount when an authenticated user is detected.
 */
export function clearSoftWall() {
  try {
    localStorage.removeItem(COUNT_KEY);
    localStorage.removeItem(SHOWN_AT_KEY);
  } catch { /* ignore */ }
}
