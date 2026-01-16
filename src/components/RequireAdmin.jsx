import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLES = ["Admin", "SuperAdmin"];

const RequireAdmin = ({ children, superAdminOnly = false }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  const userRole = user.role || user.Role;

  if (superAdminOnly && userRole !== "SuperAdmin") {
    return <Navigate to="/admin" />;
  }

  if (!ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/feed" />;
  }

  return children;
};

export default RequireAdmin;
