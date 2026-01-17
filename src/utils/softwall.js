const COUNT_KEY = 'pl_guest_seen_count_v1';
const SHOWN_AT_KEY = 'pl_soft_wall_shown_at_v1';

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
  // guest
  try {
    const cur = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0;
    localStorage.setItem(COUNT_KEY, String(cur + 1));
  } catch { /* ignore */ }
}

export function clearSoftWall() {
  try {
    localStorage.removeItem(COUNT_KEY);
    localStorage.removeItem(SHOWN_AT_KEY);
  } catch { /* ignore */ }
}
