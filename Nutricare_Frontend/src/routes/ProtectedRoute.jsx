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
  if (user === undefined) {
    return <Navigate to="/login" />;
  }

  // Logged in but no profile → go to form
  if (requireProfile && !user) {
    return <Navigate to="/user-form" />;
  }

  // Otherwise → allow access
  return children;
}
