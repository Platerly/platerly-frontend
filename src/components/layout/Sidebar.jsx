// src/components/layout/Sidebar.jsx
import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Book, Settings, User, Users, Sparkles, Bell, ShoppingCart, CalendarDays } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import { useNotifications } from '../../context/NotificationsContext'

const cx = (...a) => a.filter(Boolean).join(' ')

/* Reusable nav item with premium styling */
// eslint-disable-next-line no-unused-vars
const NavItem = ({ to, icon: Icon, children, end = false, isActiveMatch, badge }) => {
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
          'group flex items-center gap-4 text-base px-4 py-3 rounded-xl transition-all duration-200 outline-none',
          'focus-visible:ring-2 focus-visible:ring-recipzee-green/60 focus-visible:ring-offset-0',
          active
            ? 'bg-recipzee-green text-recipzee-dark font-semibold shadow-lg shadow-recipzee-green/20'
            : 'text-recipzee-text hover:bg-recipzee-card hover:border-recipzee-green/20 hover:text-recipzee-green'
        )
      }}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {({ isActive }) => {
        const active =
          typeof isActiveMatch === 'function'
            ? isActiveMatch(location)
            : isActive
        return (
          <>
            <div className={cx(
              'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              active
                ? 'bg-recipzee-dark/20'
                : 'bg-recipzee-card group-hover:bg-recipzee-green/10'
            )}>
              <Icon className="w-5 h-5 shrink-0" />
              {badge > 0 && (
                <span className={cx(
                  'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center',
                  'text-[10px] font-bold rounded-full',
                  active
                    ? 'bg-recipzee-dark text-recipzee-green'
                    : 'bg-red-500 text-white'
                )}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="truncate">{children}</span>
          </>
        )
      }}
    </NavLink>
  )
}

/* Feed nav item - scrolls to top if already on feed */
// eslint-disable-next-line no-unused-vars
const FeedNavItem = ({ icon: Icon }) => {
  const location = useLocation()
  const isOnFeed = location.pathname === '/feed'

  const handleClick = (e) => {
    if (isOnFeed) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <NavLink
      to="/feed"
      end
      onClick={handleClick}
      className={({ isActive }) => cx(
        'group flex items-center gap-4 text-base px-4 py-3 rounded-xl transition-all duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-recipzee-green/60 focus-visible:ring-offset-0',
        isActive
          ? 'bg-recipzee-green text-recipzee-dark font-semibold shadow-lg shadow-recipzee-green/20'
          : 'text-recipzee-text hover:bg-recipzee-card hover:border-recipzee-green/20 hover:text-recipzee-green'
      )}
      aria-label="Feed"
    >
      {({ isActive }) => (
        <>
          <div className={cx(
            'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
            isActive
              ? 'bg-recipzee-dark/20'
              : 'bg-recipzee-card group-hover:bg-recipzee-green/10'
          )}>
            <Icon className="w-5 h-5 shrink-0" />
          </div>
          <span className="truncate">Feed</span>
        </>
      )}
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
  const { unreadCount } = useNotifications()
  const authed = useAuthed(user, token)
  const homeTarget = authed ? '/feed' : '/login'

  return (
    <div className="flex h-full w-full flex-col justify-between p-6">
      <div>
        {/* Logo with icon - click reloads the page */}
        <button
          onClick={() => window.location.href = homeTarget}
          aria-label="Recipzee Home"
          title="Reload Recipzee"
          className="flex items-center gap-3 mb-10 group cursor-pointer"
        >
          <span className="text-3xl font-bold text-recipzee-green tracking-tight">
            Recipzee
          </span>
        </button>

        {authed ? (
          <nav className="flex flex-col space-y-1.5" role="navigation" aria-label="Main">
            <FeedNavItem icon={Home} />
            <NavItem to="/explore-chefs" icon={Users} end>Explore Chefs</NavItem>
            <NavItem to="/create" icon={PlusCircle} end>Create Recipe</NavItem>
            <NavItem to="/cookbooks" icon={Book} end>My Cookbooks</NavItem>
            <NavItem to="/shopping-list" icon={ShoppingCart} end>Shopping List</NavItem>
            <NavItem to="/meal-planner" icon={CalendarDays} end>Meal Planner</NavItem>
            <NavItem to="/notifications" icon={Bell} end badge={unreadCount}>Notifications</NavItem>

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
            <p className="mb-4 text-sm text-recipzee-subtle">
              Join Recipzee to create and save recipes
            </p>
            <Link
              to="/register"
              className="block text-center bg-recipzee-green hover:brightness-110 text-recipzee-dark font-semibold py-3 px-4 rounded-xl shadow-lg shadow-recipzee-green/20 transition-all duration-200"
            >
              Join Recipzee
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-recipzee-border">
        <div className="text-xs text-recipzee-subtle">
          &copy; {new Date().getFullYear()} Recipzee
        </div>
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
        'bg-recipzee-light text-recipzee-text',
        'w-[260px] h-screen'
      )}
      aria-label="Primary"
    >
      <SidebarPanel />
    </aside>
  )
}

/* === MOBILE BOTTOM TABS (single source of truth) === */
const MobileTabBar = ({ authed }) => {
  const location = useLocation()
  const isActive = (path, startsWith = false) =>
    startsWith ? location.pathname.startsWith(path) : location.pathname === path

  if (!authed) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-40 bg-recipzee-card/95 border-t border-recipzee-border backdrop-blur-md md:hidden">
        <div className="safe-area-inset-b h-16 flex items-stretch justify-between px-4">
          <Link
            to="/register"
            className="w-full mx-auto my-2.5 inline-flex items-center justify-center gap-2 rounded-xl bg-recipzee-green text-recipzee-dark font-semibold px-4 py-2.5 shadow-lg shadow-recipzee-green/20"
            aria-label="Join Recipzee"
          >
            <Sparkles className="w-4 h-4" />
            Join Recipzee
          </Link>
        </div>
      </div>
    )
  }

  // eslint-disable-next-line no-unused-vars
  const TabItem = ({ to, icon: Icon, label, matchStartsWith = false }) => {
    const active = isActive(to, matchStartsWith)
    return (
      <li className="flex">
        <Link
          to={to}
          className={cx(
            'flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors',
            active ? 'text-recipzee-green' : 'text-recipzee-subtle'
          )}
          aria-label={label}
        >
          <div className={cx(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
            active ? 'bg-recipzee-green/15' : 'bg-transparent'
          )}>
            <Icon className={cx('w-5 h-5', active && 'scale-110')} />
          </div>
          <span className={cx('font-medium', active && 'text-recipzee-green')}>{label}</span>
        </Link>
      </li>
    )
  }

  // Feed tab - scrolls to top if already on feed
  // eslint-disable-next-line no-unused-vars
  const FeedTabItem = ({ icon: Icon }) => {
    const active = isActive('/feed', false)
    const handleClick = (e) => {
      if (active) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    return (
      <li className="flex">
        <Link
          to="/feed"
          onClick={handleClick}
          className={cx(
            'flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors',
            active ? 'text-recipzee-green' : 'text-recipzee-subtle'
          )}
          aria-label="Feed"
        >
          <div className={cx(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
            active ? 'bg-recipzee-green/15' : 'bg-transparent'
          )}>
            <Icon className={cx('w-5 h-5', active && 'scale-110')} />
          </div>
          <span className={cx('font-medium', active && 'text-recipzee-green')}>Feed</span>
        </Link>
      </li>
    )
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-recipzee-card/95 border-t border-recipzee-border backdrop-blur-md md:hidden"
      role="navigation"
      aria-label="Primary mobile"
    >
      <ul className="safe-area-inset-b h-[72px] grid grid-cols-5 px-1">
        <FeedTabItem icon={Home} />
        <TabItem to="/explore-chefs" icon={Users} label="Chefs" />
        <TabItem to="/create" icon={PlusCircle} label="Create" />
        <TabItem to="/cookbooks" icon={Book} label="Books" matchStartsWith />
        <TabItem to="/settings" icon={Settings} label="Settings" matchStartsWith />
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
      <MobileTabBar authed={authed} />
    </>
  )
}
