import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto py-12 space-y-4">
      <input placeholder="Email" className="input" />
      <button
        onClick={() => navigate("/reset-password")}
        className="btn-primary"
      >
        Send OTP
      </button>
    </div>
  );
}
