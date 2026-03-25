import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../shared/api/http";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const verify = async () => {
    try {
      await api.post("/otp/verifyOtp", { email: state.email, otp });
      await api.post("/auth/register", {
        email: state.email,
        password: state.password,
        conformPassword: state.confirmPassword,
        userType: state.userType,
      });
      navigate("/login");
    } catch {
      setMessage("Invalid OTP or registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
        <h2 className="text-xl font-bold text-teal-700 mb-4">Verify OTP</h2>
        {message && <p className="text-red-500 text-sm mb-2">{message}</p>}
        <input
          className="w-full border p-2 rounded mb-4"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button
          onClick={verify}
          className="w-full bg-teal-600 text-white py-2 rounded"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
