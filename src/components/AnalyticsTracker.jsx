/**
 * AnalyticsTracker.jsx — Renderless GA4 pageview tracker for Recipzee.
 *
 * Layer: Analytics / cross-cutting concern (no visual output).
 *
 * Fires a GA4 pageview hit on every client-side route change.
 * Admin routes and admin users are silently skipped to avoid polluting analytics
 * with internal traffic.  Admin detection uses the auth token's role claim rather
 * than an implicit global flag (window.__RECIPZEE_ADMIN_MODE__).
 * Only fires in production (VITE_ENV === "production").
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { useAuth } from "../context/AuthContext";

/**
 * Renderless component that sends a GA4 pageview on every route change.
 * Must be rendered inside BrowserRouter so `useLocation` works.
 *
 * @returns {null} Renders nothing to the DOM.
 */
export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Skip analytics for admin routes to prevent exposure
    if (location.pathname.startsWith("/admin")) {
      return;
    }
    // Derive admin status from the auth token's role claim — avoids relying on
    // an implicit global flag that could be stale or missing.
    const role = (user?.role || user?.Role || '').toLowerCase();
    if (role === 'admin' || role === 'superadmin') {
      return;
    }
    // Only send hits in production to avoid polluting GA with dev/staging traffic
    if (import.meta.env.VITE_ENV === "production") {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location, user]); // re-runs whenever route or user changes
  return null;
}
