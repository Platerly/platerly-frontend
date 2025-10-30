import { useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
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

const Login = () => {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true) // premium apps default to remembering

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
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: 'include' // <— to set HttpOnly refresh cookie
      })

      let data
      try { data = await res.json() } catch { data = {} }

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password')
      }

      // Expecting { token, user }
      if (data?.token && data?.user) {
        // Synchronous persist (sessionStorage if remember=false)
        login({ token: data.token, user: data.user, remember })
      }

      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-platerly-dark text-platerly-text flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-platerly-card border border-platerly-border rounded-2xl shadow-xl/50 shadow-black/10 backdrop-blur-sm p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Log in to <span className="text-platerly-accent">Platerly</span>
            </h1>
            <p className="text-sm text-platerly-muted mt-2">
              Welcome back! Please enter your details.
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
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
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="remember" className="flex items-center gap-2 select-none">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-platerly-border bg-transparent"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="text-platerly-muted">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-platerly-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </Button>
          </form>

          <p className="text-center text-sm text-platerly-muted mt-6">
            Don’t have an account?{' '}
            <Link to="/register" className="text-platerly-accent hover:underline">
              Join Platerly
            </Link>
          </p>
        </div>

        {/* Footer tiny text */}
        <p className="text-center text-xs text-platerly-muted mt-4">By continuing, you agree to our{' '}
          <Link to="/terms" className="underline hover:no-underline">Terms</Link> &{' '}
          <Link to="/privacy" className="underline hover:no-underline">Privacy</Link>.
        </p>
      </div>
    </div>
  )
}

export default Login
