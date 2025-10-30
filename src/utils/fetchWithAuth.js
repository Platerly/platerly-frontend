// src/utils/fetchWithAuth.js
import { useMemo } from 'react'
import { API_BASE_URL } from './api'
import { useAuth } from '../context/AuthContext'

/**
 * Make a refresh-aware fetch. Used inside the hook.
 */
function createApiFetch(getToken, tryRefresh, onUnauthorized) {
  return async function apiFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url
    const isAbsolute = /^https?:\/\//i.test(url || '')
    const finalUrl = isAbsolute ? url : `${API_BASE_URL}${url?.startsWith('/') ? '' : '/'}${url || ''}`

    const doFetch = async (withAuth = true) => {
      const headers = new Headers(init.headers || {})
      if (withAuth) {
        const t = getToken()
        if (t) headers.set('Authorization', `Bearer ${t}`)
      }
      // NOTE: do not set Content-Type if body is FormData
      const isFormData = (init.body && typeof FormData !== 'undefined' && init.body instanceof FormData)
      if (!isFormData && init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json')
      }
      return fetch(finalUrl, { ...init, headers, credentials: 'include' })
    }

    let res = await doFetch(true)
    if (res.status !== 401) return res

    // try one silent refresh
    const refreshed = await tryRefresh().catch(() => false)
    if (!refreshed) {
      onUnauthorized?.()
      return res
    }
    // retry with new access token
    return doFetch(true)
  }
}

/**
 * Hook usage (recommended in components)
 */
export function useApi() {
  const { token, refreshAccessToken, logout } = useAuth()

  const apiFetch = useMemo(
    () =>
      createApiFetch(
        () => token,
        async () => {
          const ok = await refreshAccessToken()
          return !!ok
        },
        () => logout()
      ),
    [token, refreshAccessToken, logout]
  )

  return { apiFetch }
}

/**
 * OPTIONAL named export (for non-React modules)
 * This fallback reads from localStorage so it can be used in utility files.
 * Prefer the hook in components.
 */
export const apiFetch = createApiFetch(
  () => {
    try {
      // adjust this key if your AuthContext uses a different one
      return localStorage.getItem('pl_access_token') || ''
    } catch {
      return ''
    }
  },
  async () => false, // no refresh available outside React context
  () => {}
)
