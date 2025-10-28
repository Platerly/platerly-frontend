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

  useEffect(() => {
    document.title = 'Platerly — Allergy-aware recipes'
  }, [])

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        {/* Hero card */}
        <div className="text-center space-y-6 bg-platerly-card/60 border border-platerly-light rounded-3xl px-6 sm:px-10 py-10 shadow">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Welcome to <span className="text-platerly-green">Platerly</span>
          </h1>

          <p className="text-base sm:text-lg text-platerly-subtle">
            The recipe network for the future — allergy-aware, halal by design,
            and powered by intelligent ingredients. Built for everyone, everywhere.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link to="/register" className="w-full sm:w-40">
              <Button
                size="lg"
                className="w-full focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
              >
                Join Platerly
              </Button>
            </Link>

            <Link to="/login" className="w-full sm:w-40">
              <Button
                variant="secondary"
                size="lg"
                className="w-full focus:outline-none focus:ring-2 focus:ring-platerly-green/40"
              >
                Log In
              </Button>
            </Link>
          </div>

          {/* Explore as guest (soft wall will handle later) */}
          <div className="pt-2">
            <Link
              to="/feed?tab=explore"
              className="text-sm text-platerly-yellow hover:underline focus:outline-none focus:ring-2 focus:ring-platerly-green/40 rounded"
            >
              Explore recipes as a guest →
            </Link>
          </div>
        </div>

        {/* Footer links (tiny + brand) */}
        <div className="mt-6 text-center text-xs text-platerly-subtle">
          <Link
            to="/privacy"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-platerly-green/30 rounded px-1"
          >
            Privacy
          </Link>
          <span className="mx-2">•</span>
          <Link
            to="/terms"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-platerly-green/30 rounded px-1"
          >
            Terms
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing
