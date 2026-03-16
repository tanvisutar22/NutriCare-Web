import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/Loader";

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setLoading(true);
    try {
      await api.post("/otp/sendOtp", { email });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      console.log("Verifying OTP for email:", email); // Debug log
      console.log("OTP entered:", otp); // Debug log
      // Step 1: Verify OTP
     const data1= await api.post("/otp/verifyOtp", { email, otp });
      console.log("OTP verification response:", data1); // Debug log
      // Step 2: Register user
      await api.post("/auth/register", {
        email,
        password,
        conformPassword: confirmPassword, // ✅ backend expects "conformPassword"
        userType: "User",
      });

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      console.error("Error during registration:", err.data); // Debug log
      alert(
        err.response?.data?.message || "Invalid OTP or registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      {loading && <Loader />}
      {step === 1 && (
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
            placeholder="Confirm Password"
            className="input"
          />
          <button onClick={sendOtp} className="btn-primary">
            Send OTP
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="input"
          />
          <button onClick={verifyOtp} className="btn-primary">
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );
}
