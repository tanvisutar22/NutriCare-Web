import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkSessionThunk, loginThunk, logoutThunk } from "../store/slices/authSlice";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const profile = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(checkSessionThunk());
  }, [dispatch]);

  const login = async (email, password) => {
    const resultAction = await dispatch(loginThunk({ email, password }));

    if (loginThunk.rejected.match(resultAction)) {
      throw resultAction.payload || new Error("Login failed");
    }

    return true;
  };

  const logout = async () => {
    await dispatch(logoutThunk());
  };

  const value = {
    user: auth.isAuthenticated
      ? {
          name: profile.data?.name || "",
          email: profile.data?.email || "",
          hasProfile: profile.hasProfile,
          profile: profile.data,
        }
      : null,
    login,
    logout,
    isAuthenticated: auth.isAuthenticated,
    initialized: auth.initialized,
    authLoading: auth.loading,
    hasProfile: profile.hasProfile,
    profile: profile.data,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
