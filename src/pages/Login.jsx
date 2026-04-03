/**
 * Login
 *
 * Layer: Public authentication page.
 * Route: /login  (honours ?redirect= query param for post-login navigation)
 *
 * What this page does:
 *  - Primary path: Google OAuth via SocialLoginButtons component
 *  - Secondary path: collapsible email/password form (hidden by default to reduce friction)
 *  - On successful login, writes JWT + user object via AuthContext.login()
 *  - Redirects to ?redirect= path after login, falling back to /feed
 *    (redirect is sanitised to same-site only — no open-redirect)
 *  - OAuth users whose username contains '@' (email-based username) are sent to
 *    /onboarding to set a proper username before using the app
 *  - `remember` checkbox controls whether the token is stored in localStorage (persistent)
 *    or sessionStorage (session-only); default is unchecked for security
 */
import { useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// Small helper to read ?redirect=/path safely
const useRedirectPath = () => {
  const location = useLocation()
  return useMemo(() => {
    const qp = new URLSearchParams(location.search)
    const p = qp.get('redirect') || '/feed'
    // prevent open-redirects: only allow same-site relative paths
    return /^\//.test(p) ? p : '/feed'
  }, [location.search])
}

// Check if user needs onboarding (OAuth users with email-based username)
const needsOnboarding = (user) => {
  if (!user?.username) return false
  // OAuth users often have email as username - they need to set a proper username
  return user.username.includes('@')
}

/** @returns {JSX.Element} */
const Login = () => {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false) // default unchecked for security
  const [showEmailForm, setShowEmailForm] = useState(false)

  const navigate = useNavigate()
  const redirectPath = useRedirectPath()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        rememberMe: remember, 
      }),
      credentials: 'include', // to set HttpOnly refresh cookie
    })

    let data
    try { data = await res.json() } catch { data = {} }

    if (!res.ok) {
      throw new Error(data.message || 'Invalid email or password')
    }

    if (data?.token && data?.user) {
      // write token into storage (localStorage if remember=true)
      login({ token: data.token, user: data.user, remember })

      // Check if user needs to complete onboarding (email-based username)
      if (needsOnboarding(data.user)) {
        navigate('/onboarding', { replace: true })
        return
      }
    }

    navigate(redirectPath, { replace: true })
  } catch (err) {
    setError(err.message || 'Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="min-h-[100svh] bg-recipzee-dark text-recipzee-text flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 -left-32 w-80 h-80 bg-recipzee-green/10 rounded-full blur-[120px]" />
      <div className="hidden sm:block absolute bottom-1/4 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Card - no backdrop-blur on mobile for performance */}
        <div className="bg-recipzee-card sm:bg-recipzee-card/80 sm:backdrop-blur-md border border-recipzee-border rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back to <span className="text-recipzee-accent">Recipzee</span>
            </h1>
            <p className="text-sm text-recipzee-muted mt-2">
              One click to sign in
            </p>
          </div>

          {/* Social Login - Primary Option */}
          <SocialLoginButtons
            onSuccess={(data) => {
              if (data?.token && data?.user) {
                login({ token: data.token, user: data.user, remember: true })
                // Redirect OAuth users with email usernames to onboarding
                if (needsOnboarding(data.user)) {
                  navigate('/onboarding', { replace: true })
                } else {
                  navigate(redirectPath, { replace: true })
                }
              }
            }}
            onError={(msg) => setError(msg)}
            disabled={loading}
            showDivider={false}
          />

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-2 text-sm"
            >
              {error}
            </div>
          )}

          {/* Collapsible Email Form */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-recipzee-muted hover:text-recipzee-text transition-colors"
            >
              <span>Or use email instead</span>
              {showEmailForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-5 overflow-hidden transition-all duration-300 ${showEmailForm ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="username"
            />

            <div className="space-y-2">
              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                enterKeyHint="done"
              />
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="remember" className="flex items-center gap-2 select-none">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-recipzee-border bg-transparent"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="text-recipzee-muted">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-recipzee-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </Button>
          </form>

          <p className="text-center text-sm text-recipzee-muted mt-6">
            Don’t have an account?{' '}
            <Link to="/register" className="text-recipzee-accent hover:underline">
              Join Recipzee
            </Link>
          </p>
        </div>

        {/* Footer tiny text */}
        <p className="text-center text-xs text-recipzee-muted mt-4">By continuing, you agree to our{' '}
          <Link to="/terms" className="underline hover:no-underline">Terms</Link> &{' '}
          <Link to="/privacy" className="underline hover:no-underline">Privacy</Link>.
        </p>
      </div>
    </div>
  )
}

export default Login
