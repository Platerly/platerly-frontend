/**
 * RequireAdmin.jsx — Admin role guard for protected admin routes.
 *
 * Layer: Routing / auth guard.
 *
 * Behaviour:
 *   - While auth is resolving: shows a loading spinner.
 *   - Not authenticated: redirects to /login.
 *   - Authenticated but not Admin/SuperAdmin: redirects to /feed.
 *   - `superAdminOnly=true` and role is only "Admin": redirects to /admin.
 *   - Passes for Admin or SuperAdmin (or only SuperAdmin when flagged).
 *
 * Props:
 *   @prop {ReactNode} children         — The protected admin page to render.
 *   @prop {boolean}  [superAdminOnly=false] — If true, only SuperAdmin role is
 *     permitted; plain Admin users are sent back to /admin.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Normalised (lowercase) roles that are allowed to access general admin routes.
// Comparing lowercase on both sides avoids mismatches when the JWT serialiser
// capitalises role names differently across environments.
const ADMIN_ROLES = ["admin", "superadmin"];

const RequireAdmin = ({ children, superAdminOnly = false }) => {
  const { user, token, loading } = useAuth();

  // Wait for the auth context to finish its initial load before making any decision
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // No session — send to login
  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  // Normalise role to lowercase so "Admin", "admin", and "ADMIN" all match
  const userRole = (user.role || user.Role || '').toLowerCase();

  // SuperAdmin-only routes downgrade plain Admins back to the admin dashboard
  if (superAdminOnly && userRole !== "superadmin") {
    return <Navigate to="/admin" />;
  }

  // Non-admin users have no business here — redirect to the main app
  if (!ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/feed" />;
  }

  return children;
};

export default RequireAdmin;
