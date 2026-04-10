import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import Billing from "./pages/Billing";
import Notes from "./pages/Notes";
import ChatWidget from "./components/ChatWidget";
import DailyLog from "./pages/DailyLog";
import DoctorLogin from "./doctor/DoctorLogin";
import DoctorDashboard from "./doctor/DoctorDashboard";
import DoctorProtectedRoute from "./doctor/DoctorProtectedRoute";
import DoctorRegister from "./pages/DoctorRegister";
import AdminLogin from "./admin/AdminLogin";
import AdminPanel from "./admin/AdminPanel";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import { useAuth } from "./context/AuthContext";
import DailyTracking from "./pages/DailyTracking";
import Analytics from "./pages/Analytics";
import MealDetails from "./pages/MealDetails";
import MealLog from "./pages/MealLog";
import DoctorBooking from "./pages/DoctorBooking";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showUserChat =
    isAuthenticated &&
    !location.pathname.startsWith("/doctor") &&
    !location.pathname.startsWith("/admin") &&
    !["/", "/about", "/login", "/register", "/forgot-password", "/reset-password"].includes(
      location.pathname,
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_18%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#050816_0%,#08142d_30%,#0a1f4a_58%,#071121_100%)] text-slate-100">
      <Navbar />
      <main className="min-h-[calc(100vh-140px)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserModule /></ProtectedRoute>} />
          <Route path="/metrics" element={<ProtectedRoute requireProfile><BodyMetricsModule /></ProtectedRoute>} />
          <Route path="/diets" element={<ProtectedRoute requireProfile><DietsModule /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute requireProfile><RecipesPage /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute requireProfile><Billing /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute requireProfile><Notes /></ProtectedRoute>} />
          <Route path="/daily-log" element={<ProtectedRoute requireProfile><DailyLog /></ProtectedRoute>} />
          <Route path="/daily-tracking" element={<ProtectedRoute requireProfile><DailyTracking /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute requireProfile><Analytics /></ProtectedRoute>} />
          <Route path="/meal-details" element={<ProtectedRoute requireProfile><MealDetails /></ProtectedRoute>} />
          <Route path="/meal-log" element={<ProtectedRoute requireProfile><MealLog /></ProtectedRoute>} />
          <Route path="/doctor-booking" element={<ProtectedRoute requireProfile><DoctorBooking /></ProtectedRoute>} />

          <Route path="/user" element={<Navigate to="/profile" replace />} />
          <Route path="/body-metrics" element={<Navigate to="/metrics" replace />} />

          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/register" element={<DoctorRegister />} />
          <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<DoctorProtectedRoute><DoctorDashboard /></DoctorProtectedRoute>} />
          <Route path="/doctor/patients" element={<DoctorProtectedRoute><DoctorDashboard /></DoctorProtectedRoute>} />
          <Route path="/doctor/patients/:patientAuthId" element={<DoctorProtectedRoute><DoctorDashboard /></DoctorProtectedRoute>} />
          <Route path="/doctor/notes" element={<DoctorProtectedRoute><DoctorDashboard /></DoctorProtectedRoute>} />
          <Route path="/doctor/profile" element={<DoctorProtectedRoute><DoctorDashboard /></DoctorProtectedRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminPanel /></AdminProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!location.pathname.startsWith("/doctor") && !location.pathname.startsWith("/admin") ? <Footer /> : null}
      {showUserChat ? <ChatWidget /> : null}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
