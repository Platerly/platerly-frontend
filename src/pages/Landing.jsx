import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

const Landing = () => {
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
