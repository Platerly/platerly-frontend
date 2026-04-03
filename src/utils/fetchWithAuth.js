/**
 * utils/fetchWithAuth.js — Layer: Utility / HTTP transport (authenticated)
 *
 * Provides two flavours of an authenticated fetch wrapper:
 *
 *  1. `useApi()` hook — for use inside React components.
 *     Reads the token from AuthContext and calls context-provided refresh/logout
 *     functions so React state stays in sync.
 *
 *  2. `apiFetch` singleton — for use outside React (service workers, plain modules,
 *     saga/thunk middleware, etc.).  Reads/writes the token directly from
 *     localStorage or sessionStorage and redirects to /login on hard auth failure.
 *
 * Both variants share the same core logic via `createApiFetch`:
 *  - Injects Authorization: Bearer <token> header if token is present and the
 *    caller has not already set an Authorization header.
 *  - On 401/403: attempts one silent token refresh via POST /api/Auth/refresh.
 *  - If refresh succeeds, retries the original request once with the new token.
 *  - If refresh fails or the retry is still unauthorised, triggers `onUnauthorized`.
 */
import { useMemo } from 'react'
import { API_BASE_URL } from './api'
import { useAuth } from '../context/AuthContext'

// The key used to store the JWT in both sessionStorage and localStorage.
// Keeping it in one constant avoids typo-driven mismatches.
const TOKEN_KEY = 'token'

// -------- storage helpers --------

/**
 * Reads the JWT from storage, preferring sessionStorage over localStorage.
 * sessionStorage is checked first because it represents a "session-only" login
 * (remember-me unchecked), and its token should take precedence.
 *
 * Wrapped in try/catch because storage access can throw in private-browsing
 * contexts with strict settings, or in sandboxed iframes.
 *
 * @returns {string} The stored JWT, or an empty string if none found
 */
function getTokenFromStorage() {
  try {
    const ss = sessionStorage.getItem(TOKEN_KEY)
    if (ss) return ss
    const ls = localStorage.getItem(TOKEN_KEY)
    if (ls) return ls
  } catch { /* storage unavailable */ }
  return ''
}

/**
 * Writes a new JWT back to whichever storage currently holds one.
 * This mirrors the strategy used at login time — if the user chose
 * "remember me" (localStorage) the refreshed token goes back there;
 * otherwise it stays in sessionStorage.
 * Falls back to sessionStorage if neither storage holds an existing token.
 *
 * @param {string} newToken - The new JWT received from the refresh endpoint
 */
function setTokenInStorage(newToken) {
  if (!newToken) return
  try {
    if (sessionStorage.getItem(TOKEN_KEY) != null) {
      sessionStorage.setItem(TOKEN_KEY, newToken)
      return
    }
    if (localStorage.getItem(TOKEN_KEY) != null) {
      localStorage.setItem(TOKEN_KEY, newToken)
      return
    }
    // default to sessionStorage
    sessionStorage.setItem(TOKEN_KEY, newToken)
  } catch { /* storage unavailable */ }
}

// -------- core wrapper --------

/**
 * Factory that creates an `apiFetch` function wired to caller-supplied
 * token/refresh/unauthorised-handler dependencies.  The factory pattern lets
 * the same retry/refresh logic be shared between the React-hook variant
 * (which uses AuthContext) and the standalone singleton (which uses storage).
 *
 * @param {function(): string}          getToken       - Returns the current JWT (or empty string)
 * @param {function(): Promise<boolean>} tryRefresh     - Attempts a silent token refresh; resolves true on success
 * @param {function(): void}            onUnauthorized - Called when auth cannot be recovered (logout / redirect)
 * @returns {function(string|Request, RequestInit): Promise<Response>} An authenticated fetch wrapper
 */
function createApiFetch(getToken, tryRefresh, onUnauthorized) {
  return async function apiFetch(input, init = {}) {
    // Resolve the target URL — accept both strings and Request objects.
    // Relative paths are prefixed with API_BASE_URL; absolute URLs are used as-is.
    const rawUrl = typeof input === 'string' ? input : input?.url
    const isAbsolute = /^https?:\/\//i.test(rawUrl || '')
    const finalUrl = isAbsolute
      ? rawUrl
      : `${API_BASE_URL}${rawUrl?.startsWith('/') ? '' : '/'}${rawUrl || ''}`

    /**
     * Inner fetch helper — called once on the first attempt and again after a
     * successful token refresh.  Injects the Authorization header each time so
     * that the retried request uses the newly refreshed token.
     *
     * @returns {Promise<Response>}
     */
    const doFetch = async () => {
      const headers = new Headers(init.headers || {})
      const t = getToken()
      // Only inject the header if there is a token and the caller hasn't already set one
      if (t && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${t}`)
      }

      // Detect FormData so we don't set Content-Type manually — the browser
      // must set it (with the multipart boundary) for file uploads to work.
      const isFormData =
        init.body &&
        typeof FormData !== 'undefined' &&
        init.body instanceof FormData

      if (!isFormData && init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }

      // Always send cookies (credentials: 'include') so the HttpOnly refresh
      // cookie is available to the backend on the /api/Auth/refresh endpoint.
      return fetch(finalUrl, { ...init, headers, credentials: 'include' })
    }

    let res = await doFetch()

    // 403 = server understood the request but the user lacks permission.
    // This is NOT an auth failure — do NOT attempt a refresh and do NOT log out.
    // A free user hitting a premium endpoint should never be signed out.
    if (res.status === 403) {
      const err = Object.assign(new Error('Forbidden'), { status: 403 })
      throw err
    }

    // Non-401 responses are returned as-is to the caller
    if (res.status !== 401) {
      return res
    }

    // 401 only: try a single silent token refresh
    const refreshed = await tryRefresh().catch(() => false)
    if (!refreshed) {
      // Refresh cookie expired / revoked — full logout
      onUnauthorized?.()
      throw new Error('Unauthorized – session expired')
    }

    // Retry once with the new token
    res = await doFetch()

    if (res.status === 401) {
      onUnauthorized?.()
      throw new Error('Unauthorized – session expired')
    }

    // 403 on retry = genuinely forbidden, not an auth issue
    if (res.status === 403) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    return res
  }
}

/**
 * React hook that returns an authenticated fetch function tied to AuthContext.
 * Recreated via useMemo whenever token, logout, or refreshAccessToken changes
 * so the returned function always closes over the latest auth state.
 *
 * @returns {{ apiFetch: function }} Object containing the authenticated fetch wrapper
 */
export function useApi() {
  const { token, logout, refreshAccessToken } = useAuth()

  const apiFetch = useMemo(
    () =>
      createApiFetch(
        // getToken: always reads from the AuthContext closure (React state)
        () => token || '',
        // tryRefresh: calls AuthContext's refreshAccessToken and coerces to boolean
        async () => !!(await refreshAccessToken()),
        // onUnauthorized: clears React state and navigates to login
        () => logout() // your logout can clear state + navigate to /login
      ),
    [token, logout, refreshAccessToken]
  )

  return { apiFetch }
}

/**
 * Calls POST /api/Auth/refresh using the HttpOnly refresh cookie.
 * On success, persists the new access token to whichever storage is active.
 * Used by the standalone `apiFetch` singleton (outside React).
 *
 * @returns {Promise<boolean>} True if a new token was obtained, false otherwise
 */
async function refreshOutsideReact() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // refresh cookie (HttpOnly) is sent by the browser
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    if (!data?.token) return false
    setTokenInStorage(data.token)
    return true
  } catch {
    return false
  }
}

/**
 * Handles a hard auth failure outside the React tree.
 * Clears stored tokens then dispatches a `recipzee:unauthorized` CustomEvent so
 * AuthContext (which listens for it) can null out React state and let the router
 * redirect to /login.  This avoids a window.location.assign() that races with
 * ongoing React route transitions.
 */
function handleUnauthorizedOutsideReact() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch { /* storage unavailable */ }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('recipzee:unauthorized'))
  }
}

/**
 * Pre-built authenticated fetch singleton for use outside React components
 * (plain modules, analytics helpers, etc.).  Uses storage-based token retrieval
 * and handles auth failure with a hard redirect to /login.
 *
 * @type {function(string|Request, RequestInit): Promise<Response>}
 */
export const apiFetch = createApiFetch(
  () => getTokenFromStorage(),
  async () => await refreshOutsideReact(),
  handleUnauthorizedOutsideReact
)
