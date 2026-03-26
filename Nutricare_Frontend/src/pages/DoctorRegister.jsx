import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../shared/api/http";
import Loader from "../components/Loader";

export default function DoctorRegister() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const sendOtp = async () => {
    setMessage("");
    setLoading(true);
    try {
      await api.post("/otp/sendOtp", { email });
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMessage("");
    setLoading(true);
    try {
      await api.post("/otp/verifyOtp", { email, otp });
      await api.post("/auth/register", {
        email,
        password,
        conformPassword: confirmPassword,
        userType: "Docter",
      });
      navigate("/doctor/login");
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid OTP or registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Doctor signup</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create your doctor account using OTP verification.
          </p>
        </div>

        <div className="mt-8 bg-white border border-gray-100 rounded-3xl shadow-lg p-6 md:p-8">
          {loading && <Loader />}

          {message ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="input"
              />

              <button onClick={sendOtp} className="btn-primary w-full" disabled={loading}>
                Send OTP
              </button>

              <div className="text-sm text-slate-600 text-center">
                Already have an account?{" "}
                <Link to="/doctor/login" className="text-teal-700 hover:underline">
                  Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="input"
              />

              <button onClick={verifyOtp} className="btn-primary w-full" disabled={loading}>
                Verify & Register
              </button>

              <button
                onClick={() => setStep(1)}
                className="btn-secondary w-full"
                disabled={loading}
                type="button"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

