import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function DoctorProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.doctorAuth);
  return isAuthenticated ? children : <Navigate to="/doctor/login" replace />;
}

