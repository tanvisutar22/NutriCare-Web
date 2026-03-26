import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.adminAuth);
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

