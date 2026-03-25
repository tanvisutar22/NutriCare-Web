// // import { useState } from "react";
// // import { useAuth } from "../context/AuthContext";
// // import { useNavigate, Link } from "react-router-dom";

// // export default function Login() {
// //   const { login } = useAuth();
// //   const navigate = useNavigate();
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [error, setError] = useState("");

// //   const handleLogin = async () => {
// //     try {
// //       await login(email, password);
// //       console.log("Login successful, navigating to dashboard");
// //       navigate("/dashboard");
// //     } catch {
// //       setError("Invalid credentials or server error");
// //     }
// //   };

// //   return (
// //     <div className="max-w-md mx-auto py-12 space-y-4">
// //       {error && <p className="text-red-500">{error}</p>}
// //       <input
// //         placeholder="Email"
// //         value={email}
// //         onChange={(e) => setEmail(e.target.value)}
// //         className="input"
// //       />
// //       <input
// //         type="password"
// //         placeholder="Password"
// //         value={password}
// //         onChange={(e) => setPassword(e.target.value)}
// //         className="input"
// //       />
// //       <button onClick={handleLogin} className="btn-primary">
// //         Login
// //       </button>
// //       <Link to="/forgot-password" className="text-teal-600">
// //         Forgot Password?
// //       </Link>
// //     </div>
// //   );
// // }

// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function Login() {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     try {
//       const hasProfile = await login(email, password);

//       if (hasProfile) {
//         navigate("/dashboard"); // ✅ only if profile exists
//       } else {
//         navigate("/user-form"); // ✅ new user, must fill profile first
//       }
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Invalid credentials or server error",
//       );
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto py-12 space-y-4">
//       {error && <p className="text-red-500">{error}</p>}
//       <input
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="input"
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         className="input"
//       />
//       <button onClick={handleLogin} className="btn-primary">
//         Login
//       </button>
//       <Link to="/forgot-password" className="text-teal-600">
//         Forgot Password?
//       </Link>
//     </div>
//   );
// }

// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// // import Loader from "../components/Loader";
// export default function Login() {
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPw, setShowPw] = useState(false);

//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     setError("");

//     if (!email.trim()) return setError("Email is required");
//     if (!password.trim()) return setError("Password is required");

//     setLoading(true);
//     try {
//       const hasProfile = await login(email, password);
//       // New after-login flow: always land on the new User module
//       // (profile can be created/updated there).
//       navigate("/user");
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Invalid credentials or server error",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-teal-50 via-white to-white flex items-center">
//       <div className="max-w-5xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
//         {/* LEFT INFO */}
//         <div className="hidden md:block">
//           <h2 className="text-4xl font-bold text-slate-900 leading-tight">
//             Welcome back to <span className="text-teal-600">NutriCare AI</span>
//           </h2>
//           <p className="text-slate-600 mt-4">
//             Login to access your dashboard, track metrics, and monitor your
//             progress.
//           </p>

//           <div className="mt-8 space-y-3 text-sm text-slate-700">
//             {[
//               "Track weight & activity",
//               "Manage goals and logs",
//               "View progress charts",
//             ].map((t) => (
//               <div key={t} className="flex items-center gap-2">
//                 <span className="h-2 w-2 rounded-full bg-teal-600" />
//                 {t}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* LOGIN CARD */}
//         <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 md:p-8">
//           <h3 className="text-2xl font-semibold text-slate-900">Login</h3>
//           <p className="text-sm text-slate-600 mt-1">
//             Enter your credentials to continue.
//           </p>

//           {error && (
//             <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
//               {error}
//             </div>
//           )}

//           <div className="mt-5 space-y-4">
//             <div>
//               <label className="text-sm text-slate-700 font-medium">
//                 Email
//               </label>
//               <input
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="input mt-2"
//               />
//             </div>

//             <div>
//               <label className="text-sm text-slate-700 font-medium">
//                 Password
//               </label>
//               <div className="mt-2 relative">
//                 <input
//                   type={showPw ? "text" : "password"}
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="input pr-20"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPw((s) => !s)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-teal-700 hover:text-teal-800"
//                 >
//                   {showPw ? "Hide" : "Show"}
//                 </button>
//               </div>
//             </div>

//             <button
//               onClick={handleLogin}
//               disabled={loading}
//               className="btn-primary w-full disabled:opacity-60"
//             >
//               {loading ? "Logging in..." : "Login"}
//             </button>

//             <div className="flex justify-between text-sm">
//               <Link
//                 to="/forgot-password"
//                 className="text-teal-700 hover:underline"
//               >
//                 Forgot Password?
//               </Link>
//               <Link to="/register" className="text-slate-700 hover:underline">
//                 Create account
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) return setError("Email is required");
    if (!password.trim()) return setError("Password is required");

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials or server error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-teal-50 via-white to-white flex items-center">
      <div className="max-w-5xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
        <div className="hidden md:block">
          <h2 className="text-4xl font-bold text-slate-900 leading-tight">
            Welcome back to <span className="text-teal-600">NutriCare AI</span>
          </h2>
          <p className="text-slate-600 mt-4">
            Login to access your dashboard, track metrics, and monitor your
            progress.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-700">
            {[
              "Track weight & activity",
              "Manage goals and logs",
              "View progress charts",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6 md:p-8">
          <h3 className="text-2xl font-semibold text-slate-900">Login</h3>
          <p className="text-sm text-slate-600 mt-1">
            Enter your credentials to continue.
          </p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-slate-700 font-medium">
                Email
              </label>
              <input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-2"
              />
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-teal-700 hover:text-teal-800"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-teal-700 hover:underline"
              >
                Forgot Password?
              </Link>
              <Link to="/register" className="text-slate-700 hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
