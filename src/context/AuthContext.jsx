/**
 * context/AuthContext.jsx — Layer: Context / Authentication
 *
 * Provides application-wide authentication state and actions via React Context.
 * All child components access auth via the `useAuth()` hook.
 *
 * JWT storage strategy:
 *  - On login, the JWT is written to either sessionStorage (remember-me unchecked)
 *    or localStorage (remember-me checked).  `storageRef` tracks which store is
 *    active so that subsequent writes (token refresh, user updates) go to the
 *    same storage location.
 *  - On bootstrap (first render), sessionStorage is checked first; if empty,
 *    localStorage is tried.  If neither holds a token, a silent refresh attempt
 *    is made using the HttpOnly refresh cookie set by the backend at login.
 *
 * Token refresh flow:
 *  - `refreshAccessToken` posts to POST /api/Auth/refresh with credentials:include
 *    so the browser sends the HttpOnly cookie.
 *  - De-duplicated via `refreshInFlightRef` — if multiple concurrent callers
 *    request a refresh, they all await the same in-flight promise instead of
 *    firing independent requests.
 *  - On success, the new token is stored and GET /api/User/me is called to
 *    hydrate (or re-hydrate) the user object.
 *
 * Google OAuth:
 *  - Google sign-in is handled entirely server-side.  The frontend receives the
 *    same { token, user } response shape as email login and calls `login()`.
 *
 * Context shape:
 *  {
 *    user              : object|null   — Hydrated user profile
 *    setUser           : function      — Direct user state setter (use updateUser for merges)
 *    updateUser        : function      — Merges partial updates into user state + storage
 *    token             : string|null  — Current JWT access token
 *    setToken          : function      — Direct token state setter
 *    login             : function      — Persists token+user, sets storage strategy
 *    logout            : function      — Clears all auth state, calls server logout
 *    authed            : boolean       — True only when both token AND user are present
 *    loading           : boolean       — True during initial bootstrap
 *    refreshAccessToken: function      — Silent token refresh using HttpOnly cookie
 *  }
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { clearPremiumCache } from "../hooks/usePremium";
import { validateAuthResponse } from "../utils/schemas";

// Timeout for silent token refresh — prevents hanging forever if the server is down
const REFRESH_TIMEOUT_MS = 10_000;

// Guest soft-wall localStorage keys — cleared whenever an authenticated session starts
const SOFTWALL_KEYS = ['pl_guest_seen_count_v1', 'pl_soft_wall_shown_at_v1'];
// localStorage/sessionStorage keys for persisting the JWT and user profile
const TOKEN_KEY = "token";
const USER_KEY  = "user";

export const AuthContext = createContext();

/**
 * Removes all guest soft-wall tracking data from localStorage.
 * Called any time a valid authenticated session is detected or established to
 * ensure guest counters don't persist into an authenticated session.
 */
function clearGuestSoftWall() {
  try {
    // remove correct keys
    SOFTWALL_KEYS.forEach(k => localStorage.removeItem(k));
    // clean up legacy/typo'd key if present
    localStorage.removeItem('pl_guet_seen_count_v1');
  } catch { /* ignore */ }
}

/**
 * Reads the stored token and user JSON from a given storage object.
 * Returns nulls for both if storage is unavailable or the JSON is malformed.
 *
 * @param {Storage} storage - sessionStorage or localStorage
 * @returns {{ token: string|null, user: object|null }}
 */
function readFrom(storage) {
  try {
    const t = storage.getItem(TOKEN_KEY);
    const u = storage.getItem(USER_KEY);
    return { token: t || null, user: u ? JSON.parse(u) : null };
  } catch {
    return { token: null, user: null };
  }
}

/**
 * Writes token and user to the given storage object.
 * Only writes fields that are truthy to avoid overwriting a valid token with null.
 *
 * @param {Storage|null} storage
 * @param {{ token: string|null, user: object|null }} param1
 */
function writeTo(storage, { token, user }) {
  if (!storage) return;
  if (token) storage.setItem(TOKEN_KEY, token);
  if (user)  storage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Removes token and user entries from the given storage object.
 *
 * @param {Storage|null} storage
 */
function clearFrom(storage) {
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when a silent refresh fails so the UI can surface a message
  const [authError, setAuthError] = useState(null);

  // Tracks which storage holds the current session (sessionStorage vs localStorage).
  // Set at login and read by refreshAccessToken / updateUser to write to the correct store.
  const storageRef = useRef(null);

  // Holds the in-flight refresh promise to de-duplicate concurrent refresh calls.
  // Multiple callers (e.g. several 401 responses arriving simultaneously) will
  // all await this same promise rather than issuing parallel refresh requests.
  const refreshInFlightRef = useRef(null);

  // Bootstrap session: check storage first, then attempt a silent cookie-based refresh
  useEffect(() => {
    const ss = readFrom(sessionStorage);
    if (ss.token) {
      // Session-only login found in sessionStorage
      storageRef.current = sessionStorage;
      setToken(ss.token);
      setUser(ss.user);
      clearGuestSoftWall(); // ✅ already authenticated
      setLoading(false);
      return;
    }
    const ls = readFrom(localStorage);
    if (ls.token) {
      // "Remember me" login found in localStorage
      storageRef.current = localStorage;
      setToken(ls.token);
      setUser(ls.user);
      clearGuestSoftWall(); // ✅ already authenticated
      setLoading(false);
      return;
    }

    // No token saved — attempt silent refresh using HttpOnly cookie
    // (the cookie persists across browser restarts for "remember me" sessions)
    (async () => {
      await refreshAccessToken(); // will clear guest flags if it succeeds
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Persists a successful login response to storage and updates React state.
   *
   * @param {{ token: string, user: object, remember: boolean }} param0
   *   remember — when true, writes to localStorage (survives browser restart);
   *              when false, writes to sessionStorage (cleared on tab close).
   */
  const login = useCallback(({ token: newToken, user: newUser, remember }) => {
    const store = remember ? localStorage : sessionStorage;
    storageRef.current = store;
    writeTo(store, { token: newToken, user: newUser });
    setToken(newToken);
    setUser(newUser);
    clearGuestSoftWall(); // ✅ ensure guest counters go away instantly
  }, []);

  /**
   * Clears all auth state, removes stored tokens, and performs a best-effort
   * server-side logout to revoke the refresh token cookie.
   * Also clears the premium status cache so stale subscription data is not served
   * to any subsequent user who logs in on the same device.
   */
  const logout = useCallback(() => {
    // best-effort server logout (revokes current RT)
    fetch(`${API_BASE_URL}/api/Auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    clearFrom(sessionStorage);
    clearFrom(localStorage);
    clearPremiumCache();
    storageRef.current = null;
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  /**
   * Silently refreshes the access token using the HttpOnly refresh cookie.
   * De-duplicated: if a refresh is already in flight, returns the same promise.
   * On success, persists the new token and re-fetches the user profile.
   *
   * @returns {Promise<boolean>} True if a new token was obtained
   */
  const refreshAccessToken = useCallback(async () => {
    // If a refresh is already in flight, piggyback on it rather than sending a duplicate request
    if (refreshInFlightRef.current) {
      try { return await refreshInFlightRef.current; } catch { return false; }
    }

    const doRefresh = (async () => {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), REFRESH_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
          method: 'POST',
          credentials: 'include', // sends the HttpOnly refresh cookie
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          // Issue 2: clear stale token BEFORE nulling state to prevent 401 retry loop
          clearFrom(sessionStorage);
          clearFrom(localStorage);
          setToken(null);
          setUser(null);
          setAuthError('Your session could not be restored. Please log in again.');
          return false;
        }

        const raw = await res.json().catch(() => ({}));
        const data = validateAuthResponse(raw);
        const newToken = data?.token;
        if (!newToken) return false;

        // Persist new token in whichever store we're using (default to sessionStorage)
        const store = storageRef.current || sessionStorage;
        writeTo(store, { token: newToken, user: null });

        setToken(newToken);

        // Always try to hydrate user data after refresh — the user object may
        // not be in storage (e.g. first visit on a new device with a valid cookie)
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
        } catch { /* ignore */ }

        clearGuestSoftWall(); // ✅ successful auth path: clear guest counters
        return true;
      } catch {
        clearTimeout(timeoutId);
        // Issue 1 & 2: on timeout or network error, clear stale token then null state
        clearFrom(sessionStorage);
        clearFrom(localStorage);
        setToken(null);
        setUser(null);
        setAuthError('Your session could not be restored. Please log in again.');
        return false;
      } finally {
        // Release the in-flight reference so future calls work correctly
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = doRefresh;
    return doRefresh;
  }, []);

  // Issue 3: listen for the custom event fired by the standalone apiFetch singleton
  // when it encounters an unrecoverable 401 outside the React tree.  This lets
  // AuthContext clear state and the React router handle navigation to /login instead
  // of a hard window.location.assign() that races with ongoing route transitions.
  useEffect(() => {
    const handler = () => {
      clearFrom(sessionStorage);
      clearFrom(localStorage);
      clearPremiumCache();
      storageRef.current = null;
      setToken(null);
      setUser(null);
      setAuthError('Your session expired. Please log in again.');
    };
    window.addEventListener('recipzee:unauthorized', handler);
    return () => window.removeEventListener('recipzee:unauthorized', handler);
  }, []); // stable: state setters never change

  // `authed` is true only when BOTH token and user are present.
  // This prevents brief periods during refresh where token is set but user is null
  // from triggering authenticated-only renders.
  const authed = useMemo(() => !!token && !!user, [token, user]);

  /**
   * Merges partial user updates into the current user object and writes the
   * result back to the active storage.  Used for profile edits, email changes, etc.
   * Reads the current token directly from storage to avoid stale closure issues
   * when this is called from within an async callback.
   *
   * @param {Partial<object>} updates - Fields to merge into the user object
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

  // Memoize context value to prevent unnecessary re-renders across the whole tree
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
    // authError is set when a silent refresh fails so components can surface a message
    authError,
    clearAuthError: () => setAuthError(null),
  }), [user, token, authed, loading, login, logout, updateUser, refreshAccessToken, authError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Convenience hook for consuming AuthContext.
 * Must be used inside a component wrapped by AuthProvider.
 *
 * @returns {object} The auth context value
 */
export function useAuth() {
  return useContext(AuthContext);
}
