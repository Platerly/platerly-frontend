// src/config/softWall.js
export const SOFT_WALL_ENABLED = true;

// Thresholds
export const SOFT_WALL_DAILY_LIMIT = 3;  // views allowed per rolling 24h window
export const SOFT_WALL_MIN_UNIQUE_DAYS = 2; // after 3 distinct days seen, prompt even if light usage

// Cooldowns / windows (ms)
export const SOFT_WALL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes: don’t nag again for a while
export const SOFT_WALL_ROLLING_WINDOW_MS = 4 * 60 * 60 * 1000; // 4h rolling window

// Storage keys
export const SOFT_WALL_KEYS = {
  viewsLog: 'pl_guest_views_log_v1',      // JSON array of timestamps (ms) of counted views
  daysSeen: 'pl_guest_days_seen_v1',      // JSON array of YYYY-MM-DD strings
  dismissedAt: 'pl_soft_wall_dismissed_at_v1', // timestamp ms when last dismissed
  seenTokens: 'pl_guest_seen_tokens_v1',  // JSON array of unique tokens to avoid double-count
};
