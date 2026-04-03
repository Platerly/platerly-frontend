/**
 * Register
 *
 * Layer: Public account creation page.
 * Route: /register
 *
 * What this page does:
 *  - Primary path: Google OAuth via SocialLoginButtons (one click)
 *  - Secondary path: collapsible email/password form (hidden by default)
 *  - Email registration flow:
 *      1. POST /api/Auth/register → receives JWT + user on success
 *      2. Calls AuthContext.login() to persist the session
 *      3. Fires `trackSignUp('email')` and `trackStartTrial()` analytics events
 *      4. Navigates to /onboarding for profile setup
 *  - Google OAuth flow:
 *      - `data.isNewUser` flag (from LoginResponse) distinguishes new sign-ups from
 *        returning users — analytics events fire only for new users
 *      - All users with email-based usernames are sent to /onboarding
 *  - Trial activation:
 *      - The backend sets TrialStartUtc/TrialEndUtc on every new registration
 *        (both email and Google — handled in AuthController.Register + HandleGoogleAuth)
 *      - `trackStartTrial()` fires on the frontend as a matching analytics signal
 *  - Password strength indicator with 5-level scoring (shown only when password field has input)
 *
 * State managed:
 *  - form: name, email, password, confirmPassword
 *  - errors: per-field validation + social error
 *  - showEmailForm: toggles collapsible email section
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'
import { trackSignUp, trackStartTrial } from '../utils/analytics'

// Check if user needs onboarding (users with email-based username)
const needsOnboarding = (user) => {
  if (!user?.username) return false
  return user.username.includes('@')
}

// Password strength calculation
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const levels = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-green-500' }
  ]

  const index = Math.min(score, 4)
  return { score, label: levels[index].label, color: levels[index].color }
}

/** @returns {JSX.Element} */
const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (form.password.length < 8) e.password = 'Minimum 8 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
    if (!form.agreedToTerms) e.agreedToTerms = 'You must agree to the Terms and Services to continue.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          displayName: form.name.trim(),
          password: form.password
        })
      })

      let data
      try { data = await res.json() } catch { data = {} }

      if (!res.ok) {
        // Handle validation errors from ASP.NET
        if (data.errors) {
          const firstError = Object.values(data.errors).flat()[0]
          throw new Error(firstError || 'Validation failed.')
        }
        throw new Error(data.message || data.title || 'Registration failed.')
      }

      // Auto-login and go to onboarding
      if (data?.token && data?.user) {
        login({ token: data.token, user: data.user, remember: true })
        trackSignUp('email')
        trackStartTrial()
        navigate('/onboarding', { replace: true })
        return
      }

      // Fallback: if backend doesn't return token, call login endpoint
      const loginRes = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        credentials: 'include'
      })

      let loginData
      try { loginData = await loginRes.json() } catch { loginData = {} }

      if (!loginRes.ok || !loginData?.token || !loginData?.user) {
        navigate('/login', { replace: true })
        return
      }

      login({ token: loginData.token, user: loginData.user, remember: true })
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setErrors((s) => ({ ...s, email: err.message || 'Registration failed.' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-recipzee-dark text-recipzee-text flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 -right-32 w-80 h-80 bg-recipzee-green/10 rounded-full blur-[120px]" />
      <div className="hidden sm:block absolute bottom-1/4 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-recipzee-card sm:bg-recipzee-card/80 sm:backdrop-blur-md border border-recipzee-border rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <span>✦</span> 7-day Premium trial included — no card required
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Join <span className="text-recipzee-accent">Recipzee</span>
            </h1>
            <p className="text-sm text-recipzee-muted mt-2">One click to get started</p>
          </div>

          {/* Social Login - Primary Option */}
          <SocialLoginButtons
            onSuccess={(data) => {
              if (data?.token && data?.user) {
                login({ token: data.token, user: data.user, remember: true })
                // isNewUser is set by the backend LoginResponse only for first-time Google sign-ups.
                // Returning Google users who happen to use this page should NOT re-fire trial events.
                if (data.isNewUser) {
                  trackSignUp('google')
                  trackStartTrial()
                }
                // All users go through onboarding
                if (needsOnboarding(data.user)) {
                  navigate('/onboarding', { replace: true })
                } else {
                  navigate('/feed', { replace: true })
                }
              }
            }}
            onError={(msg) => setErrors((s) => ({ ...s, social: msg }))}
            disabled={loading}
            showDivider={false}
          />

          {/* Error message */}
          {(errors.social || errors.email) && (
            <div role="alert" aria-live="assertive" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-2 text-sm">
              {errors.social || errors.email}
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

          <form onSubmit={handleSubmit} className={`space-y-4 overflow-hidden transition-all duration-300 ${showEmailForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              error={errors.name}
              required
              autoComplete="name"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                error={errors.password}
                required
                autoComplete="new-password"
              />

              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < getPasswordStrength(form.password).score
                            ? getPasswordStrength(form.password).color
                            : 'bg-recipzee-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-recipzee-muted">
                    {getPasswordStrength(form.password).label}
                    {getPasswordStrength(form.password).score < 3 && (
                      <span className="ml-1">— Try adding uppercase, numbers, or symbols</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            {/* Terms agreement */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={form.agreedToTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-recipzee-border accent-recipzee-green flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm text-recipzee-muted leading-snug">
                  I agree to the{' '}
                  <Link to="/terms" className="text-recipzee-accent hover:underline">Terms and Services</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-recipzee-accent hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="mt-1.5 text-xs text-red-400">{errors.agreedToTerms}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue'}
            </Button>
          </form>

          <p className="text-center text-sm text-recipzee-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-recipzee-accent hover:underline">Log in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-recipzee-muted mt-4">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline hover:no-underline">Terms</Link> &{' '}
          <Link to="/privacy" className="underline hover:no-underline">Privacy</Link>.
        </p>
      </div>
    </div>
  )
}

export default Register
