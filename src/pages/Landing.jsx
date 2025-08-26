import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

const Landing = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  // Also check storage so returning users bounce immediately on cold start
  const stored =
    typeof window !== 'undefined'
      ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
      : null

  useEffect(() => {
    const authed = !!(user || token || stored)
    if (authed) {
      navigate('/feed', { replace: true })
    }
  }, [user, token, stored, navigate])

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold leading-tight">
          Welcome to <span className="text-platerly-green">Platerly</span>
        </h1>

        <p className="text-lg text-platerly-subtle">
          The recipe network for the future — allergy-aware, halal by design, and powered by intelligent ingredients. Built for everyone, everywhere.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/register">
            <Button size="lg" className="w-40">Join Platerly</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg" className="w-40">Log In</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing
