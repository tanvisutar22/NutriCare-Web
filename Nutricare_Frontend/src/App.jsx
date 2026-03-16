import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import DietPlan from "./pages/DietPlan";
import ProtectedRoute from "./routes/ProtectedRoute";
import UpdateProfile from "./pages/UpdateProfile";
import UserForm from "./pages/UserForm";
import VariableMetrics from "./pages/VariableMetrics";
import DietLog from "./pages/DietLog";
import GoalHistory from "./pages/GoalHistory";
import MetricCharts from "./pages/MetricCharts";
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-form"
            element={
              <ProtectedRoute>
                <UserForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/update-profile"
            element={
              <ProtectedRoute>
                <UpdateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet-plan"
            element={
              <ProtectedRoute>
                <DietPlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metric"
            element={
              <ProtectedRoute>
                <VariableMetrics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metric-charts"
            element={
              <ProtectedRoute>
                <MetricCharts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet-log"
            element={
              <ProtectedRoute>
                <DietLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goal-history"
            element={
              <ProtectedRoute>
                <GoalHistory />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
