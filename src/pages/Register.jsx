import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { login } from '../utils/auth'
import { API_BASE_URL } from '../utils/api'

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required.'
    if (!form.username.trim()) newErrors.username = 'Username is required.'
    if (!form.email.includes('@')) newErrors.email = 'Enter a valid email.'
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/User/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          displayName: form.name,
          bio: form.bio,
          profileImageUrl: null,
          password: form.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed.')
      }

      const data = await response.json()
      login(data.token, data.userId)
      navigate('/feed')
    } catch (err) {
      setErrors({ email: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="min-h-screen bg-platerly-dark text-platerly-text flex items-center justify-center px-4">
    <div className="bg-platerly-card border border-platerly-border rounded-xl shadow-xl px-8 py-10 w-full max-w-md">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Create your <span className="text-green-500">Platerly</span> account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Ayub A."
          error={errors.name}
          required
        />

        <Input
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="e.g. starcircuit"
          error={errors.username}
          required
        />

        <Input
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Tell us a little about yourself..."
          error={errors.bio}
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
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          required
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-green-500 hover:underline">Log in</Link>
      </p>
    </div>
  </div>
)

}

export default Register
