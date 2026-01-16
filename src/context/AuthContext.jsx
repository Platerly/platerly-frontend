import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { clearPremiumCache } from "../hooks/usePremium";

const SOFTWALL_KEYS = ['pl_guest_seen_count_v1', 'pl_soft_wall_shown_at_v1'];
const TOKEN_KEY = "token";
const USER_KEY  = "user";

export const AuthContext = createContext();

function clearGuestSoftWall() {
  try {
    // remove correct keys
    SOFTWALL_KEYS.forEach(k => localStorage.removeItem(k));
    // clean up legacy/typo’d key if present
    localStorage.removeItem('pl_guet_seen_count_v1');
  } catch {}
}

function readFrom(storage) {
  try {
    const t = storage.getItem(TOKEN_KEY);
    const u = storage.getItem(USER_KEY);
    return { token: t || null, user: u ? JSON.parse(u) : null };
  } catch {
    return { token: null, user: null };
  }
}

function writeTo(storage, { token, user }) {
  if (!storage) return;
  if (token) storage.setItem(TOKEN_KEY, token);
  if (user)  storage.setItem(USER_KEY, JSON.stringify(user));
}

function clearFrom(storage) {
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Which storage holds the current session (sessionStorage vs localStorage)
  const storageRef = useRef(null);

  // De-dupe concurrent refreshes
  const refreshInFlightRef = useRef(null);

  // Bootstrap session
  useEffect(() => {
    const ss = readFrom(sessionStorage);
    if (ss.token) {
      storageRef.current = sessionStorage;
      setToken(ss.token);
      setUser(ss.user);
      clearGuestSoftWall(); // ✅ already authenticated
      setLoading(false);
      return;
    }
    const ls = readFrom(localStorage);
    if (ls.token) {
      storageRef.current = localStorage;
      setToken(ls.token);
      setUser(ls.user);
      clearGuestSoftWall(); // ✅ already authenticated
      setLoading(false);
      return;
    }

    // No token saved — attempt silent refresh using HttpOnly cookie
    (async () => {
      await refreshAccessToken(); // will clear guest flags if it succeeds
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(({ token: newToken, user: newUser, remember }) => {
    const store = remember ? localStorage : sessionStorage;
    storageRef.current = store;
    writeTo(store, { token: newToken, user: newUser });
    setToken(newToken);
    setUser(newUser);
    clearGuestSoftWall(); // ✅ ensure guest counters go away instantly
  }, []);

  const logout = useCallback(() => {
    // best-effort server logout (revokes current RT)
    fetch(`${API_BASE_URL}/api/Auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearFrom(sessionStorage);
    clearFrom(localStorage);
    clearPremiumCache();
    storageRef.current = null;
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Refresh access token using HttpOnly refresh cookie.
   * POST /api/Auth/refresh -> { token }
   */
  const refreshAccessToken = useCallback(async () => {
    if (refreshInFlightRef.current) {
      try { return await refreshInFlightRef.current; } catch { return false; }
    }

    const doRefresh = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        if (!res.ok) return false;

        const data = await res.json().catch(() => ({}));
        const newToken = data?.token;
        if (!newToken) return false;

        // Persist new token in whichever store we're using (default to sessionStorage)
        const store = storageRef.current || sessionStorage;
        writeTo(store, { token: newToken, user: null });

        setToken(newToken);

        // Always try to hydrate user data after refresh
        try {
          const me = await fetch(`${API_BASE_URL}/api/User/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: 'include'
          });
          if (me.ok) {
            const u = await me.json();
            setUser(u);
            writeTo(store, { token: newToken, user: u });
          }
        } catch {}

        clearGuestSoftWall(); // ✅ successful auth path: clear guest counters
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = doRefresh;
    return doRefresh;
  }, []);

  const authed = useMemo(() => !!token && !!user, [token, user]);

  /**
   * Update user data in state and storage (for profile edits, etc.)
   * Merges partial updates with existing user data.
   */
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      const store = storageRef.current;
      if (store) {
        // Read current token from storage to avoid stale closure
        const currentToken = store.getItem(TOKEN_KEY);
        if (currentToken) {
          writeTo(store, { token: currentToken, user: newUser });
        }
      }
      return newUser;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    setUser,
    updateUser,
    token,
    setToken,
    login,
    logout,
    authed,
    loading,
    refreshAccessToken,
  }), [user, token, authed, loading, login, logout, updateUser, refreshAccessToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
