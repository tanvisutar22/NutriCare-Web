import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const reset = () => {
    if (otp === "123456") navigate("/login");
    else alert("Invalid OTP");
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-4">
      <input
        placeholder="OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="input"
      />
      <input type="password" placeholder="New Password" className="input" />
      <input type="password" placeholder="Confirm Password" className="input" />
      <button onClick={reset} className="btn-primary">
        Reset Password
      </button>
    </div>
  );
}
