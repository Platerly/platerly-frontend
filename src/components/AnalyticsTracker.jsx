import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    // Skip analytics for admin routes to prevent exposure
    if (location.pathname.startsWith("/admin")) {
      return;
    }
    // Also check the global admin mode flag
    if (window.__RECIPZEE_ADMIN_MODE__) {
      return;
    }
    if (import.meta.env.VITE_ENV === "production") {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);
  return null;
}
