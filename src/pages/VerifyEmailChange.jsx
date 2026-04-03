/**
 * VerifyEmailChange
 *
 * Layer: Public email-change confirmation page.
 * Route: /verify-email-change?token=<jwt>
 *
 * Flow:
 *  1. User clicks the confirmation link sent to their NEW email address after
 *     requesting an email change in Settings → Account
 *  2. GET /api/Auth/verify-email-change?token=… is called on mount
 *  3. On success: shows confirmation, then logs the user out after 3 seconds.
 *     The logout is required because the JWT still encodes the OLD email — the user
 *     must log in fresh with their new credentials.
 *  4. After logout: navigates to /login?message=email-changed
 *  5. On failure: shows error with links to Settings and Home
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X, Loader2, Mail } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/Auth/verify-email-change?token=${encodeURIComponent(token)}`)

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Verification failed')
        }

        setStatus('success')
        setMessage('Your email has been changed successfully!')

        // The existing JWT encodes the old email address, so it must be invalidated.
        // The user logs back in with their new email to get a fresh token.
        setTimeout(() => {
          logout()
          navigate('/login?message=email-changed')
        }, 3000)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Failed to verify email change')
      }
    }

    verifyEmail()
  }, [token, logout, navigate])

  return (
    <div className="min-h-screen bg-recipzee-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-recipzee-card border border-recipzee-border rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-recipzee-green/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-recipzee-green animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-recipzee-text mb-2">
              Verifying your new email...
            </h2>
            <p className="text-recipzee-muted text-sm">
              Please wait while we confirm your email change.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-recipzee-green/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-recipzee-green" />
            </div>
            <h2 className="text-xl font-semibold text-recipzee-text mb-2">
              Email Changed Successfully!
            </h2>
            <p className="text-recipzee-muted text-sm mb-4">
              {message}
            </p>
            <p className="text-recipzee-subtle text-xs">
              Redirecting to login page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-recipzee-text mb-2">
              Verification Failed
            </h2>
            <p className="text-recipzee-muted text-sm mb-6">
              {message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/settings?tab=account')}
                className="px-4 py-2 bg-recipzee-accent text-white rounded-lg hover:bg-recipzee-accent/90 transition-colors"
              >
                Go to Settings
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-recipzee-border text-recipzee-text rounded-lg hover:bg-recipzee-border/70 transition-colors"
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailChange
