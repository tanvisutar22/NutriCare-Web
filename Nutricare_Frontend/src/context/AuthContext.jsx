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

import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      // Step 1: authenticate
      await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        userType: "User",
      });

      // Step 2: check profile
      try {
        const res = await api.get("/users/me");
        // Keep logged-in state + profile together
        setUser({ hasProfile: true, profile: res.data.data });
        return true; // ✅ profile exists
      } catch (err) {
        if (err.response?.status === 404) {
          // ✅ logged in, but no profile yet
          setUser({ hasProfile: false, profile: null });
          return false;
        }
        throw err;
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // const logout = async () => {
  //   await api.get("/auth/logout");
  //   setUser(null);
  // };
  const logout = async () => {
    try {
      await api.get("/auth/logout");
      setUser(null); // ✅ clear user state
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
