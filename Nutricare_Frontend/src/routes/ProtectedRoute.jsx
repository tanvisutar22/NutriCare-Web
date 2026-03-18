// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" />;
// }
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireProfile = false }) {
  const { user } = useAuth();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Logged in but no profile → send to new profile module
  if (requireProfile && user?.hasProfile === false) {
    return <Navigate to="/user" />;
  }

  // Otherwise → allow access
  return children;
}
