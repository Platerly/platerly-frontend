import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-platerly-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-platerly-green/30 border-t-platerly-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-platerly-subtle text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) return <Navigate to="/login" />;

  return children;
};

export default RequireAuth;
