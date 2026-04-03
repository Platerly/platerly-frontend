/**
 * RequireAuth.jsx — Authentication guard for all user-only routes.
 *
 * Layer: Routing / auth guard.
 *
 * Behaviour:
 *   - While auth context is loading: shows a branded full-screen spinner so
 *     the page doesn't flash to the login redirect on a cold load.
 *   - Not authenticated (no user or no token): hard-redirects to /login.
 *   - Authenticated: renders `children` as-is.
 *
 * Props:
 *   @prop {ReactNode} children — The protected page/component to render.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * @param {{ children: ReactNode }} props
 * @returns {JSX.Element}
 */
const RequireAuth = ({ children }) => {
  const { user, token, loading } = useAuth();

  // Show a spinner while the auth context resolves its persisted token,
  // preventing a flash-redirect on hard refresh for already-logged-in users
  if (loading) {
    return (
      <div className="min-h-screen bg-recipzee-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-recipzee-green/30 border-t-recipzee-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-recipzee-subtle text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Both user object and JWT token must be present; token absence means session expired
  if (!user || !token) return <Navigate to="/login" />;

  return children;
};

export default RequireAuth;
