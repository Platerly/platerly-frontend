/**
 * config/softWall.js — Layer: Config / Guest engagement gating
 *
 * Configuration constants for the soft paywall shown to unauthenticated (guest)
 * visitors.  A "soft wall" is a non-blocking sign-up prompt that appears after
 * a guest has engaged enough to demonstrate genuine interest, without preventing
 * them from viewing content the way a hard paywall would.
 *
 * What triggers the wall:
 *  - The guest has viewed >= SOFT_WALL_DAILY_LIMIT content items within the
 *    SOFT_WALL_ROLLING_WINDOW_MS rolling window, OR
 *  - The guest has visited on >= SOFT_WALL_MIN_UNIQUE_DAYS distinct calendar days
 *    (indicating a returning visitor, even if each individual session was light).
 *
 * What the wall gates:
 *  - The wall is a modal/overlay prompt asking the user to register or log in.
 *  - It does NOT prevent the underlying page from loading — content remains
 *    visible behind the overlay.
 *
 * Cooldown behaviour:
 *  - Once dismissed, the wall will not re-appear for SOFT_WALL_COOLDOWN_MS (30 min)
 *    to avoid repeatedly nagging a user who isn't ready to sign up.
 *
 * Storage is managed by utils/softwall.js; components read this config to decide
 * whether the thresholds have been crossed.
 */

// Set to false to globally disable the soft wall (e.g. during A/B test off-periods)
export const SOFT_WALL_ENABLED = true;

// Thresholds
// Maximum number of content views allowed in a rolling SOFT_WALL_ROLLING_WINDOW_MS window
export const SOFT_WALL_DAILY_LIMIT = 3;
// If the guest has been seen on at least this many distinct days, prompt even if light usage
export const SOFT_WALL_MIN_UNIQUE_DAYS = 2;

// Cooldowns / windows (ms)
// After the wall is dismissed, don't show it again for this duration
export const SOFT_WALL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
// Rolling window over which SOFT_WALL_DAILY_LIMIT views are counted
export const SOFT_WALL_ROLLING_WINDOW_MS = 4 * 60 * 60 * 1000; // 4h rolling window

// Storage keys used by utils/softwall.js and SoftWallRoot to persist guest state
export const SOFT_WALL_KEYS = {
  // JSON array of timestamps (ms) — each entry represents one counted content view
  viewsLog: 'pl_guest_views_log_v1',
  // JSON array of YYYY-MM-DD strings — one entry per calendar day the guest was seen
  daysSeen: 'pl_guest_days_seen_v1',
  // Timestamp (ms) when the user last dismissed the soft wall modal
  dismissedAt: 'pl_soft_wall_dismissed_at_v1',
  // JSON array of unique content tokens already counted — prevents double-counting
  // the same recipe/card within a single session
  seenTokens: 'pl_guest_seen_tokens_v1',
};
