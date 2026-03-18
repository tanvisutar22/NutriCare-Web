// import { createContext, useContext, useState } from "react";
// import api from "../api/axios";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   const login = async (email, password) => {
//     try {
//       console.log("Attempting login with email:", email); // Debug log
//       console.log("Password entered:", password); // Debug log
//       await api.post("/auth/login", {
//         email,
//         password,
//         userType: "User", // ✅ required by backend
//       });
//       // const res = await api.get("/user/getUser");
//       // setUser(res.data.data);
//     } catch (err) {
//       console.error("Login failed:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   const logout = async () => {
//     await api.get("/auth/logout");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

import { createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, logoutThunk } from "../store/slices/authSlice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: profile, hasProfile } = useSelector((state) => state.profile);

  const login = async (email, password) => {
    const resultAction = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(resultAction)) {
      throw resultAction.payload || new Error("Login failed");
    }
    return hasProfile;
  };

  const logout = async () => {
    await dispatch(logoutThunk());
  };

  const user = isAuthenticated ? { hasProfile, profile } : null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
