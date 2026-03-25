import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, getApiErrorMessage } from "../shared/api/http";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await http.post("/otp/sendOtp", { email: email.trim().toLowerCase() });
      sessionStorage.setItem("nutricare_reset_email", email.trim().toLowerCase());
      navigate("/reset-password");
    } catch (sendError) {
      setError(getApiErrorMessage(sendError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Password Recovery
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Request reset OTP</h1>
        <p className="mt-2 text-sm text-slate-500">
          We will send an OTP to your registered email. The backend handles the
          actual email delivery and expiry.
        </p>

        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            className="input mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button onClick={handleSendOtp} disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}
