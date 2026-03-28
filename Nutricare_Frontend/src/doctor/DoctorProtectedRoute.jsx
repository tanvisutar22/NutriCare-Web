import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GlobalLoader from "../components/GlobalLoader";
import { checkDoctorSessionThunk } from "../store/slices/doctorAuthSlice";

export default function DoctorProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, initialized } = useSelector((s) => s.doctorAuth);

  useEffect(() => {
    if (!initialized) {
      dispatch(checkDoctorSessionThunk());
    }
  }, [dispatch, initialized]);

  if (!initialized) {
    return <GlobalLoader show />;
  }

  return isAuthenticated ? children : <Navigate to="/doctor/login" replace />;
}

