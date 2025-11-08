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
      if (t && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${t}`)

      const isFormData = (init.body && typeof FormData !== 'undefined' && init.body instanceof FormData)
      if (!isFormData && init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }

      return fetch(finalUrl, { ...init, headers, credentials: 'include' })
    }

    let res = await doFetch()
    if (res.status !== 401) return res

    // Try a single silent refresh
    const refreshed = await tryRefresh().catch(() => false)
    if (!refreshed) {
      onUnauthorized?.()
      return res
    }

    // Retry once with new token
    return doFetch()
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
        () => logout()
      ),
    [token, logout, refreshAccessToken]
  )

  return { apiFetch }
}

/** Named export for non-React modules (refresh via backend refresh endpoint) */
async function refreshOutsideReact() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // no body; refresh cookie (HttpOnly) is sent by the browser
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

export const apiFetch = createApiFetch(
  () => getTokenFromStorage(),
  async () => await refreshOutsideReact(),
  () => {} // no global logout here
)
