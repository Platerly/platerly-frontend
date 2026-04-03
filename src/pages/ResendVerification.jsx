/**
 * ResendVerification
 *
 * Layer: Public utility page for users whose initial verification email expired.
 * Route: /verify/resend
 *
 * Flow:
 *  1. User enters their email address
 *  2. POST /api/Auth/resend-verification-email
 *  3. 200 → success state ("check your inbox")
 *     400 → email already verified → success state + auto-navigate to /login after 2s
 *     404 → no account with that email → error state
 *     Other errors → generic error state
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

/** @returns {JSX.Element} */
const ResendVerification = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') // idle, success, error
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (res.status === 404) {
        setStatus('error')
        setMessage('No account found with this email address.')
        return
      }

      if (res.status === 400) {
        // User is already verified
        setStatus('success')
        setMessage('Your email is already verified! You can log in now.')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      if (!res.ok) {
        throw new Error('Failed to resend verification email')
      }

      setStatus('success')
      setMessage('Verification email sent! Please check your inbox.')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-recipzee-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-recipzee-subtle hover:text-recipzee-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-recipzee-card border border-recipzee-border rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-recipzee-green/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-recipzee-green" />
          </div>

          <h1 className="text-2xl font-bold text-center text-recipzee-text mb-2">
            Resend Verification Email
          </h1>
          <p className="text-recipzee-muted text-center text-sm mb-6">
            Enter your email address and we'll send you a new verification link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-recipzee-text/80">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-recipzee-dark border border-recipzee-border rounded-xl px-4 py-3 text-recipzee-text placeholder:text-recipzee-subtle focus:outline-none focus:ring-2 focus:ring-recipzee-green/40"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {message}
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm text-recipzee-green bg-recipzee-green/10 border border-recipzee-green/20 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-recipzee-green text-recipzee-dark font-medium py-3 rounded-xl hover:bg-recipzee-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          </form>

          <p className="text-center text-sm text-recipzee-subtle mt-6">
            Already verified?{' '}
            <Link to="/login" className="text-recipzee-green hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResendVerification
