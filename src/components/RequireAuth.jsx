import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Optional: Replace with spinner later

  if (!user || !token) return <Navigate to="/login" />;

  return children;
};

export default RequireAuth;
