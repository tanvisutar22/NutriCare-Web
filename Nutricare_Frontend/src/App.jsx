import { Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import ProtectedRoute from "./routes/ProtectedRoute";

import UserModule from "./pages/UserModule";
import BodyMetricsModule from "./pages/BodyMetricsModule";
import DietsModule from "./pages/DietsModule";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Old protected routes are disconnected from the main flow.
              Keep URLs safe by redirecting them into the new modules. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/user" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Navigate to="/user" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-form"
            element={
              <ProtectedRoute>
                <Navigate to="/user" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-profile"
            element={
              <ProtectedRoute>
                <Navigate to="/user" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet-plan"
            element={
              <ProtectedRoute>
                <Navigate to="/diets" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metric"
            element={
              <ProtectedRoute>
                <Navigate to="/body-metrics" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metric-charts"
            element={
              <ProtectedRoute>
                <Navigate to="/body-metrics" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet-log"
            element={
              <ProtectedRoute>
                <Navigate to="/diets" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goal-history"
            element={
              <ProtectedRoute>
                <Navigate to="/diets" replace />
              </ProtectedRoute>
            }
          />

          {/* New modules (added; old flow untouched) */}
          <Route
            path="/user"
            element={
              <ProtectedRoute requireProfile={false}>
                <UserModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/body-metrics"
            element={
              <ProtectedRoute requireProfile>
                <BodyMetricsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diets"
            element={
              <ProtectedRoute requireProfile>
                <DietsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diets"
            element={
              <ProtectedRoute requireProfile>
                <DietsModule />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
