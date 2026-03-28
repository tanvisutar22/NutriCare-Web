import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalLoader from "../components/GlobalLoader";

export default function ProtectedRoute({ children, requireProfile = false }) {
  const location = useLocation();
  const { initialized, isAuthenticated, hasProfile } = useAuth();

  if (!initialized) {
    return <GlobalLoader show />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireProfile && !hasProfile) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }

  return children;
}
