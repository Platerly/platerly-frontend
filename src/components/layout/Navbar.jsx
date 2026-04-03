/**
 * Navbar.jsx — Sticky top navigation bar for Recipzee.
 *
 * Layer: Layout.
 *
 * Auth-conditional display:
 *   - Guest:           guestLinks (Home, Explore, Login, Register)
 *   - Authenticated:   authedLinks (Home/Feed, Explore, Trending, Chefs) + Create CTA + Log Out
 *
 * The logo target adjusts to /feed for authed users and /login for guests.
 * On the landing page (`/`) the nav links and mobile menu button are hidden
 * so the marketing page can render its own CTA layout.
 *
 * Logout flow:
 *   1. POST /api/Auth/logout — attempts to clear the HttpOnly refresh cookie on
 *      the server.  Network errors are silently swallowed so logout always
 *      completes client-side.
 *   2. `logout()` from AuthContext clears the in-memory token and user state.
 *   3. Redirect to /login (replace so back-button cannot re-enter authed pages).
 *
 * Mobile menu:
 *   - Toggled by the hamburger / X button (visible only on sm and below).
 *   - Closes automatically on route change via the `location.pathname` effect.
 *
 * Premium badge / scan status are not rendered in Navbar; they appear in
 * Sidebar and RightColumn to reduce navbar clutter.
 */
// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { useAuth } from '../../context/AuthContext'
import { Menu, X, Plus, LogOut } from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, authed, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  const isLandingPage = location.pathname === '/'
  const logoTarget = authed ? '/feed' : '/login'

  const guestLinks = [
    { name: 'Home',            path: '/login'           },
    { name: 'Explore Recipes', path: '/explore-recipes' },
    { name: 'Login',           path: '/login'           },
    { name: 'Register',        path: '/register'        },
  ]
  const authedLinks = [
    { name: 'Home',            path: '/feed'             },
    { name: 'Explore Recipes', path: '/explore-recipes'  },
    { name: 'Trending',        path: '/trending'         },
    { name: 'Chefs',           path: '/explore-chefs'    },
  ]

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      // Optional server revoke: clears HttpOnly refresh cookie
      await fetch(`${API_BASE_URL}/api/Auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore network errors; still clear client state
    } finally {
      logout() // clear client token/user from storage & state
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }

  const LinkClass = ({ isActive }) =>
    classNames(
      'px-3 py-1.5 rounded-lg transition-all duration-200',
      isActive
        ? 'text-recipzee-green bg-recipzee-green/10 font-medium'
        : 'text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/50'
    )

  return (
    <header
      className={classNames(
        'sticky top-0 z-50 border-b border-recipzee-border',
        'bg-recipzee-dark/80 backdrop-blur-md supports-[backdrop-filter]:bg-recipzee-dark/70',
        'text-sm',
        'pt-[env(safe-area-inset-top)]'
      )}
      role="banner"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo */}
          <Link
            to={logoTarget}
            className="text-xl font-semibold tracking-tight text-recipzee-text hover:text-recipzee-green focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 rounded-md transition-colors"
            aria-label="Recipzee Home"
            title={`Go to ${authed ? '/feed' : '/login'}`}
          >
            <span className="text-recipzee-green">Recipzee</span>
          </Link>

          {/* Right: Desktop nav */}
          {!isLandingPage && (
            <div className="hidden sm:flex items-center gap-3">
              <nav aria-label="Primary">
                <ul className="flex items-center gap-1">
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
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-recipzee-green px-4 py-2 font-medium text-recipzee-dark hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 shadow-lg shadow-recipzee-green/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:opacity-60 transition-all"
                    disabled={loading || loggingOut}
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? 'Logging out…' : 'Log Out'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Mobile: menu button */}
          {!isLandingPage && (
            <button
              onClick={() => setOpen(v => !v)}
              className="sm:hidden inline-flex items-center justify-center rounded-xl p-2 text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/50 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 transition-colors"
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
        <div className="sm:hidden border-t border-recipzee-border bg-recipzee-dark">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col gap-1">
                {(authed ? authedLinks : guestLinks).map(({ name, path }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      className={({ isActive }) =>
                        classNames(
                          'block w-full rounded-xl px-3 py-2.5 transition-colors',
                          isActive
                            ? 'text-recipzee-green bg-recipzee-green/10 font-medium'
                            : 'text-recipzee-subtle hover:text-recipzee-text hover:bg-recipzee-light/50'
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-recipzee-green px-3 py-2.5 text-center font-medium text-recipzee-dark hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-recipzee-green/40 shadow-lg shadow-recipzee-green/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-center text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:opacity-60 transition-all"
                  disabled={loading || loggingOut}
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? 'Logging out…' : 'Log Out'}
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
