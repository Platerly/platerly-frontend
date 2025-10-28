// src/components/chrome/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { logout as utilLogout } from '../../utils/auth'
import { useAuth } from '../../context/AuthContext'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token, loading } = useAuth()
  const [open, setOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Consider authed if context or stored token exists (cold start)
  const storedToken =
    (typeof window !== 'undefined') &&
    (localStorage.getItem('token') || sessionStorage.getItem('token'))
  const authed = !!(user || token || storedToken)

  const isLandingPage = location.pathname === '/'
  const logoTarget = authed ? '/feed' : '/login'

  const guestLinks = [
    { name: 'Home', path: '/login' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
  ]
  const authedLinks = [
    { name: 'Home', path: '/feed' },
    { name: 'Explore', path: '/explore' },
    { name: 'Chefs', path: '/chefs' },
  ]

  const handleLogout = () => {
    utilLogout()
    navigate('/login', { replace: true })
  }

  const LinkClass = ({ isActive }) =>
    classNames(
      'px-2 py-1 rounded-md transition-colors',
      isActive ? 'text-white bg-white/5' : 'text-platerly-subtle hover:text-white'
    )

  return (
    <header
      className={classNames(
        'sticky top-0 z-50 border-b border-white/10',
        'bg-platerly-dark/80 backdrop-blur supports-[backdrop-filter]:bg-platerly-dark/70',
        'text-sm',
        'pt-[env(safe-area-inset-top)]' // iOS notch safe area
      )}
      role="banner"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo */}
          <Link
            to={logoTarget}
            className="text-xl font-semibold tracking-tight text-white hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 rounded-md"
            aria-label="Platerly Home"
            title={`Go to ${authed ? '/feed' : '/login'}`}
          >
            Platerly
          </Link>

          {/* Right: Desktop nav */}
          {!isLandingPage && (
            <div className="hidden sm:flex items-center gap-4">
              <nav aria-label="Primary">
                <ul className="flex items-center gap-2">
                  {(authed ? authedLinks : guestLinks).map(({ name, path }) => (
                    <li key={path}>
                      <NavLink to={path} className={LinkClass}>
                        {name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {authed ? (
                <>
                  <Link
                    to="/create"
                    className="rounded-lg bg-green-500 px-3 py-1.5 font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    Create
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-400"
                    disabled={loading}
                  >
                    Log Out
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Mobile: menu button (hidden on landing if you want it clean) */}
          {!isLandingPage && (
            <button
              onClick={() => setOpen(v => !v)}
              className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-platerly-subtle hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {!isLandingPage && open && (
        <div className="sm:hidden border-t border-white/10 bg-platerly-dark">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col gap-1">
                {(authed ? authedLinks : guestLinks).map(({ name, path }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        classNames(
                          'block w-full rounded-md px-3 py-2',
                          isActive ? 'text-white bg-white/5' : 'text-platerly-subtle hover:text-white hover:bg-white/5'
                        )
                      }
                    >
                      {name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {authed ? (
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/create"
                  className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-center font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Create
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-lg px-3 py-2 text-center text-red-400 hover:text-red-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={loading}
                >
                  Log Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
