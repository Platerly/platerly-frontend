/**
 * App.jsx — Top-level application root for Recipzee/Platerly.
 *
 * Layer: Application root (entry point for the React component tree).
 *
 * Provider wrapping order (outermost → innermost):
 *   1. ErrorBoundary      — catches any unhandled render errors and reports to Sentry
 *   2. BrowserRouter      — enables React Router v6 client-side routing
 *   3. AuthProvider       — supplies JWT token + user state to all descendants
 *   4. NotificationsProvider — supplies unread notification count / list
 *   5. SoftWallRoot       — injects guest-view counting and soft/hard paywall overlays
 *   6. AppRoutes          — renders the route tree
 *   7. AnalyticsTracker   — fires GA4 pageview events on each navigation (renderless)
 *
 * AuthProvider must wrap NotificationsProvider because the notifications context
 * reads the auth token to fetch notifications.
 * SoftWallRoot must be inside AuthProvider so it can read the authed state.
 */
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import AppRoutes from './routes/AppRoutes'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import { AnalyticsTracker } from "./components/AnalyticsTracker"
import ErrorBoundary from './components/ErrorBoundary'


/**
 * Root application component. Composes all global providers and mounts the
 * route tree plus the renderless analytics tracker.
 *
 * @returns {JSX.Element}
 */
const App = () => {
  return (
    // ErrorBoundary is outermost so it catches errors in all providers/routes
    <ErrorBoundary>
      {/* BrowserRouter provides location context required by all NavLink/Link usage */}
      <BrowserRouter>
        {/* AuthProvider must come before any context that depends on the auth token */}
        <AuthProvider>
          {/* NotificationsProvider polls for unread count using the auth token */}
          <NotificationsProvider>
            {/* SoftWallRoot counts guest page views and renders paywall overlays */}
            <SoftWallRoot>
              <AppRoutes />
              {/* AnalyticsTracker is renderless; placed inside Router so it can read location */}
              <AnalyticsTracker />
            </SoftWallRoot>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
