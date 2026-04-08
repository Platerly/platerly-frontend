/**
 * main.jsx — Layer: Bootstrap / Application entry point
 *
 * Mounts the React application into the DOM.  Execution order is intentional:
 *
 *  1. `./sentry`          — Sentry is imported first (side-effectful) so it is
 *                           active before any React code runs, capturing bootstrap errors.
 *  2. React / ReactDOM    — Core renderer.
 *  3. BrowserRouter       — HTML5 history-based routing.
 *  4. HelmetProvider      — Provides <head> management (og:tags, page titles) to all routes.
 *  5. AuthProvider        — Session bootstrap: reads stored token / attempts silent refresh.
 *                           Must wrap NotificationsProvider because notifications depend on authed state.
 *  6. NotificationsProvider — Polling and notification state; requires AuthContext.
 *  7. AppRoutes           — Route definitions (lazy-loaded pages, RequireAuth guards).
 *  8. SoftWallRoot        — Guest engagement prompt; rendered outside routes so it overlays any page.
 *  9. Toaster             — react-hot-toast portal; outside routes to survive page transitions.
 *
 * GA4 initialisation:
 *  Google Analytics is initialised here (not in sentry.js) because it is a
 *  separate concern from error tracking.  It only fires in production when
 *  VITE_GA_ID is set.  An initial 'pageview' is sent for the landing page;
 *  subsequent page views are tracked by the RouteTracker component in AppRoutes.jsx.
 *
 * www canonicalisation:
 *  `recipzee.com` is the canonical domain. www redirects to non-www at the
 *  infrastructure level (Azure Static Web Apps default domain).
 */
import "./sentry";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'
import { Toaster } from 'react-hot-toast'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import { CookieConsentProvider } from './context/CookieConsentContext'
import CookieConsentBanner from './components/common/CookieConsentBanner'

// www → non-www canonicalisation is handled at the infrastructure level
// (Azure Static Web Apps default domain = recipzee.com). No client-side redirect needed.

// GA4 and Meta Pixel are now initialised lazily inside CookieConsentContext
// only when the user has granted the corresponding consent category.
// Do NOT call ReactGA.initialize() here — doing so would fire tracking
// before consent is obtained, which violates PIPEDA.

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode intentionally double-invokes certain lifecycle methods in dev
  // to surface side-effect bugs — has no effect in production builds
  <React.StrictMode>
    {/* HelmetProvider must be an outer ancestor so all pages can write <head> tags */}
    <HelmetProvider>
      {/* AuthProvider bootstraps session state before any child component renders */}
      <AuthProvider>
        {/* NotificationsProvider depends on AuthContext for the token and authed state */}
        <NotificationsProvider>
          {/* CookieConsentProvider manages consent state and activates GA4 / Meta Pixel
              only after the user has accepted the corresponding cookie category */}
          <CookieConsentProvider>
            {/* BrowserRouter scopes history to the component tree below */}
            <BrowserRouter>
              <AppRoutes />
              {/* SoftWallRoot renders outside routes so it can overlay any page */}
              <SoftWallRoot />
              {/* CookieConsentBanner renders the bottom bar and manage-cookies modal */}
              <CookieConsentBanner />
              {/* Toaster renders toast notifications in a fixed portal overlay */}
              <Toaster position="top-right" reverseOrder={false} />
            </BrowserRouter>
          </CookieConsentProvider>
        </NotificationsProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
)
