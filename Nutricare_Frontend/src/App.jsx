import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import UserModule from "./pages/UserModule";
import BodyMetricsModule from "./pages/BodyMetricsModule";
import DietsModule from "./pages/DietsModule";
import RecipesPage from "./pages/RecipesPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7_0%,#eff6ff_35%,#f8fafc_70%)] text-slate-900">
      <Navbar />
      <main className="min-h-[calc(100vh-140px)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metrics"
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
            path="/recipes"
            element={
              <ProtectedRoute requireProfile>
                <RecipesPage />
              </ProtectedRoute>
            }
          />

          <Route path="/user" element={<Navigate to="/profile" replace />} />
          <Route path="/body-metrics" element={<Navigate to="/metrics" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
