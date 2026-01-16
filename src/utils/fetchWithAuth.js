// utils/fetchWithAuth.js
import { useMemo } from 'react'
import { API_BASE_URL } from './api'
import { useAuth } from '../context/AuthContext'

const TOKEN_KEY = 'token'

// -------- storage helpers --------
function getTokenFromStorage() {
  try {
    const ss = sessionStorage.getItem(TOKEN_KEY)
    if (ss) return ss
    const ls = localStorage.getItem(TOKEN_KEY)
    if (ls) return ls
  } catch {}
  return ''
}

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
  } catch {}
}

// -------- core wrapper --------
function createApiFetch(getToken, tryRefresh, onUnauthorized) {
  return async function apiFetch(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input?.url
    const isAbsolute = /^https?:\/\//i.test(rawUrl || '')
    const finalUrl = isAbsolute
      ? rawUrl
      : `${API_BASE_URL}${rawUrl?.startsWith('/') ? '' : '/'}${rawUrl || ''}`

    const doFetch = async () => {
      const headers = new Headers(init.headers || {})
      const t = getToken()
      if (t && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${t}`)
      }

      const isFormData =
        init.body &&
        typeof FormData !== 'undefined' &&
        init.body instanceof FormData

      if (!isFormData && init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }

      return fetch(finalUrl, { ...init, headers, credentials: 'include' })
    }

    let res = await doFetch()

    // If not unauthorized, just return
    if (res.status !== 401 && res.status !== 403) {
      return res
    }

    // Try a single silent refresh
    const refreshed = await tryRefresh().catch(() => false)
    if (!refreshed) {
      // refresh failed -> global unauthorized handling
      onUnauthorized?.()

      // Optional: throw so callers don't accidentally use a 401 response
      throw new Error('Unauthorized – session expired')
    }

    // Retry once with new token
    res = await doFetch()

    // If still unauthorized after refresh, treat as hard logout
    if (res.status === 401 || res.status === 403) {
      onUnauthorized?.()
      throw new Error('Unauthorized – session expired')
    }

    return res
  }
}

/** Hook usage inside React components */
export function useApi() {
  const { token, logout, refreshAccessToken } = useAuth()

  const apiFetch = useMemo(
    () =>
      createApiFetch(
        () => token || '',
        async () => !!(await refreshAccessToken()),
        () => logout() // your logout can clear state + navigate to /login
      ),
    [token, logout, refreshAccessToken]
  )

  return { apiFetch }
}

/** Named export for non-React modules (refresh via backend refresh endpoint) */
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

// Global handler when we’re outside React context
function handleUnauthorizedOutsideReact() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch {}

  if (typeof window !== 'undefined') {
    const isOnLogin = window.location.pathname.startsWith('/login')
    if (!isOnLogin) {
      const params = new URLSearchParams({ reason: 'session-expired' }).toString()
      window.location.assign(`/login?${params}`)
    }
  }
}

export const apiFetch = createApiFetch(
  () => getTokenFromStorage(),
  async () => await refreshOutsideReact(),
  handleUnauthorizedOutsideReact
)
