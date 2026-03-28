import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GlobalLoader from "../components/GlobalLoader";
import { checkAdminSessionThunk } from "../store/slices/adminAuthSlice";

export default function AdminProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, initialized } = useSelector((s) => s.adminAuth);

  useEffect(() => {
    if (!initialized) {
      dispatch(checkAdminSessionThunk());
    }
  }, [dispatch, initialized]);

  if (!initialized) {
    return <GlobalLoader show />;
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

