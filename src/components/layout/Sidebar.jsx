// src/components/layout/Sidebar.jsx
import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Book, Settings, User, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const cx = (...a) => a.filter(Boolean).join(' ')

/* Reusable nav item */
const NavItem = ({ to, icon: Icon, children, end = false, isActiveMatch }) => {
  const location = useLocation()
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active =
          typeof isActiveMatch === 'function'
            ? isActiveMatch(location)
            : isActive
        return cx(
          'flex items-center gap-4 text-base px-4 py-2 rounded-md transition outline-none',
          'hover:bg-platerly-card',
          'focus-visible:ring-2 focus-visible:ring-platerly-green/60 focus-visible:ring-offset-0',
          active ? 'bg-platerly-green text-white' : 'text-platerly-text'
        )
      }}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <Icon className="w-6 h-6 shrink-0" />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

/* Authed check also reads persisted token for cold loads */
const useAuthed = (user, token) => {
  const stored =
    typeof window !== 'undefined' &&
    (localStorage.getItem('token') || sessionStorage.getItem('token'))
  return !!(user || token || stored)
}

/* === PURE PANEL (no responsive hiding) === */
export const SidebarPanel = () => {
  const { user, token } = useAuth()
  const authed = useAuthed(user, token)
  const homeTarget = authed ? '/feed' : '/login'

  return (
    <div className="flex h-full w-full flex-col justify-between p-6">
      <div>
        <Link
          to={homeTarget}
          aria-label="Platerly Home"
          title={`Go to ${authed ? '/feed' : '/login'}`}
          className="text-3xl font-bold text-platerly-green mb-10 block tracking-tight"
        >
          Platerly
        </Link>

        {authed ? (
          <nav className="flex flex-col space-y-2" role="navigation" aria-label="Main">
            <NavItem to="/feed" icon={Home} end>Feed</NavItem>
            <NavItem to="/explore-chefs" icon={Users} end>Explore Chefs</NavItem>
            <NavItem to="/create" icon={PlusCircle} end>Create Recipe</NavItem>
            <NavItem to="/cookbooks" icon={Book} end>My Cookbooks</NavItem>

            {user && (
              <NavItem
                to={`/profile/${user.username}`}
                icon={User}
                isActiveMatch={(loc) => loc.pathname.startsWith(`/profile/${user.username}`)}
              >
                Profile
              </NavItem>
            )}

            <NavItem
              to="/settings"
              icon={Settings}
              isActiveMatch={(loc) => loc.pathname.startsWith('/settings')}
            >
              Settings
            </NavItem>
          </nav>
        ) : (
          <div className="mt-10">
            <p className="mb-4 text-sm text-platerly-text/70">
              Join Platerly to create and save recipes
            </p>
            <Link
              to="/register"
              className="block text-center bg-platerly-green hover:bg-platerly-green/90 text-white font-semibold py-2 px-4 rounded-md transition"
            >
              Join Platerly
            </Link>
          </div>
        )}
      </div>

      <div className="text-xs text-platerly-text/60">
        <span>&copy; {new Date().getFullYear()} Platerly</span>
      </div>
    </div>
  )
}

/* === DESKTOP WRAPPER === */
const Sidebar = () => {
  return (
    <aside
      className={cx(
        'hidden lg:block',
        'bg-platerly-light text-platerly-text',
        'w-[260px] h-screen'
      )}
      aria-label="Primary"
    >
      <SidebarPanel />
    </aside>
  )
}

/* === MOBILE BOTTOM TABS (single source of truth) === */
const MobileTabBar = ({ authed, user }) => {
  const location = useLocation()
  const isActive = (path, startsWith = false) =>
    startsWith ? location.pathname.startsWith(path) : location.pathname === path

  if (!authed) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 bg-platerly-light/95 border-t border-platerly-border backdrop-blur supports-[backdrop-filter]:bg-platerly-light/80">
        <div className="safe-area-inset-b h-14 flex items-stretch justify-between px-4">
          <Link
            to="/register"
            className="w-full mx-auto my-2 inline-flex items-center justify-center rounded-lg bg-platerly-green text-white font-medium px-4 py-2"
            aria-label="Join Platerly"
          >
            Join Platerly
          </Link>
        </div>
      </div>
    )
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 h-[64px] bg-platerly-light/95 border-t border-platerly-border backdrop-blur supports-[backdrop-filter]:bg-platerly-light/80 md:hidden"
      role="navigation"
      aria-label="Primary mobile"
    >
      <ul className="safe-area-inset-b h-full grid grid-cols-5">
        <li className="flex">
          <Link
            to="/feed"
            className={cx(
              'flex-1 flex flex-col items-center justify-center text-xs',
              isActive('/feed') ? 'text-platerly-green' : 'text-platerly-text'
            )}
            aria-label="Feed"
          >
            <Home className="w-5 h-5" />
            <span className="mt-0.5">Feed</span>
          </Link>
        </li>

        <li className="flex">
          <Link
            to="/explore-chefs"
            className={cx(
              'flex-1 flex flex-col items-center justify-center text-xs',
              isActive('/explore-chefs') ? 'text-platerly-green' : 'text-platerly-text'
            )}
            aria-label="Explore Chefs"
          >
            <Users className="w-5 h-5" />
            <span className="mt-0.5">Chefs</span>
          </Link>
        </li>

        <li className="flex">
          <Link
            to="/create"
            className={cx(
              'flex-1 flex flex-col items-center justify-center text-xs',
              isActive('/create') ? 'text-platerly-green' : 'text-platerly-text'
            )}
            aria-label="Create Recipe"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="mt-0.5">Create</span>
          </Link>
        </li>

        <li className="flex">
          <Link
            to="/cookbooks"
            className={cx(
              'flex-1 flex flex-col items-center justify-center text-xs',
              isActive('/cookbooks', true) ? 'text-platerly-green' : 'text-platerly-text'
            )}
            aria-label="My Cookbooks"
          >
            <Book className="w-5 h-5" />
            <span className="mt-0.5">Books</span>
          </Link>
        </li>

        <li className="flex">
          <Link
            to="/settings"
            className={cx(
              'flex-1 flex flex-col items-center justify-center text-xs',
              isActive('/settings', true) ? 'text-platerly-green' : 'text-platerly-text'
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="mt-0.5">Settings</span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default function SidebarWithTabs() {
  const { user, token } = useAuth()
  const authed = useAuthed(user, token)
  return (
    <>
      <Sidebar />
      <MobileTabBar authed={authed} user={user} />
    </>
  )
}
