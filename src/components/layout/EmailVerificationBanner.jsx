// src/components/account/EmailVerificationBanner.jsx
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../utils/api'

const EmailVerificationBanner = () => {
  const { user, token, setUser } = useAuth()

  // Hooks must be at top-level, no conditionals around them.
  const [sending, setSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Normalize to boolean; undefined until first load is OK.
  const isVerified = !!user?.isEmailVerified

  // If we logged in with older payloads that didn't include isEmailVerified,
  // sync once from /api/User/me (only if token exists and flag is missing).
  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      if (!token) return
      // Only fetch if we don't yet have the flag
      if (user && typeof user.isEmailVerified === 'boolean') return
      try {
        const res = await fetch(`${API_BASE_URL}/api/User/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const me = await res.json()
        if (!cancelled && typeof me?.isEmailVerified === 'boolean') {
          setUser({ ...(user || {}), ...me })
        }
      } catch {
        // ignore network errors here
      }
    }
    sync()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const shouldShow = useMemo(() => {
    // Only show when we know the user and they’re not verified and not dismissed.
    if (!user) return false
    if (isVerified) return false
    if (dismissed) return false
    return true
  }, [user, isVerified, dismissed])

  // Now it’s safe to conditionally return — hooks already ran.
  if (!shouldShow) return null

  const handleResend = async () => {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/User/resend-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (res.ok) {
        // Optionally show a toast; do nothing else.
        return
      }
      // If API says already verified, reflect that and hide banner
      if (res.status === 400) {
        const body = await res.json().catch(() => ({}))
        const msg = (body?.message || '').toLowerCase()
        if (msg.includes('already verified')) {
          setUser({ ...(user || {}), isEmailVerified: true })
          setDismissed(true)
        }
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl my-3 px-4">
      <div className="flex items-start gap-3 rounded-xl border border-recipzee-light bg-recipzee-card p-3 sm:p-4">
        <div className="flex-1 text-sm">
          <div className="font-medium mb-1">Verify your email to unlock all Recipzee features.</div>
          <div className="text-recipzee-subtle">
            We sent a link to <b>{user?.email}</b>. Didn’t get it?
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={sending}
            className="rounded-md bg-recipzee-green text-recipzee-dark px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend verification'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md px-2 py-1.5 text-sm text-recipzee-subtle hover:text-recipzee-text hover:bg-white/5"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
