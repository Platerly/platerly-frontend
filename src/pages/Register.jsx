import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'

// Check if user needs onboarding (users with email-based username)
const needsOnboarding = (user) => {
  if (!user?.username) return false
  return user.username.includes('@')
}

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (form.password.length < 8) e.password = 'Minimum 8 characters.'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'
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
        throw new Error(data.message || 'Registration failed.')
      }

      // Auto-login and go to onboarding
      if (data?.token && data?.user) {
        login({ token: data.token, user: data.user, remember: true })
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
    <div className="min-h-[100svh] bg-platerly-dark text-platerly-text flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-1/4 -right-32 w-80 h-80 bg-platerly-green/10 rounded-full blur-[120px]" />
      <div className="hidden sm:block absolute bottom-1/4 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-platerly-card sm:bg-platerly-card/80 sm:backdrop-blur-md border border-platerly-border rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Join <span className="text-platerly-accent">Platerly</span>
            </h1>
            <p className="text-sm text-platerly-muted mt-2">Create your account in seconds</p>
          </div>

          {/* Social Login */}
          <SocialLoginButtons
            onSuccess={(data) => {
              if (data?.token && data?.user) {
                login({ token: data.token, user: data.user, remember: true })
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
          />

          {/* Error message */}
          {(errors.social || errors.email) && (
            <div role="alert" aria-live="assertive" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-2 text-sm">
              {errors.social || errors.email}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                error={errors.password}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-9 text-xs text-platerly-muted hover:text-platerly-text"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPw2 ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw2((s) => !s)}
                className="absolute right-3 top-9 text-xs text-platerly-muted hover:text-platerly-text"
                aria-label={showPw2 ? 'Hide password' : 'Show password'}
              >
                {showPw2 ? 'Hide' : 'Show'}
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue'}
            </Button>
          </form>

          <p className="text-center text-sm text-platerly-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-platerly-accent hover:underline">Log in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-platerly-muted mt-4">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline hover:no-underline">Terms</Link> &{' '}
          <Link to="/privacy" className="underline hover:no-underline">Privacy</Link>.
        </p>
      </div>
    </div>
  )
}

export default Register
