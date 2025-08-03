import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { API_BASE_URL } from '../utils/api'
import { useAuth } from '../context/AuthContext' // ✅ Import context

const Login = () => {
  const { setUser, setToken } = useAuth() // ✅ Access AuthContext
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/feed'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/User/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login credentials')
      }

      

      // ✅ Store token locally
      //localStorage.setItem('token', data.token)
      setToken(data.token) // ← assumes backend returns `token`


      // ✅ Store user globally
      setUser(data.user) // ← assumes backend returns `user` object

      // ✅ Redirect
      navigate(redirectPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text flex items-center justify-center px-4">
      <div className="bg-platerly-card border border-platerly-border rounded-xl shadow-xl px-8 py-10 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          Log in to <span className="text-green-500">Platerly</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            error={error}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            error={error}
          />

          <div className="flex justify-end text-sm">
            {/* <label className="flex items-center gap-2">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600" />
              <span className="text-gray-400">Remember me</span>
            </label> */}

            <Link to="/forgot-password" className="text-green-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{' '}
          <Link to="/register" className="text-green-500 hover:underline">
            Join Platerly
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
