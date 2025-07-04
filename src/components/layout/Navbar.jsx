import { Link, useLocation, useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { isAuthenticated, logout } from '../../utils/auth'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isLandingPage = location.pathname === '/'

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-900 text-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-green-500 tracking-tight">
          Platerly
        </Link>

        {!isLandingPage && (
          isAuthenticated() ? (
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Log Out
            </button>
          ) : (
            <nav className="flex gap-6 text-sm font-medium">
              {navLinks.map(({ name, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={classNames(
                    'hover:text-green-400 transition-colors duration-150',
                    location.pathname === path ? 'text-green-500' : 'text-gray-400'
                  )}
                >
                  {name}
                </Link>
              ))}
            </nav>
          )
        )}
      </div>
    </header>
  )
}

export default Navbar
