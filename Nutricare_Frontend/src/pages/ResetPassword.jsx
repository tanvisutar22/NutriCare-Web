import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage, http } from "../shared/api/http";

export default function ResetPassword() {
  const navigate = useNavigate();
  const savedEmail = useMemo(
    () => sessionStorage.getItem("nutricare_reset_email") || "",
    [],
  );

  const [email, setEmail] = useState(savedEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyOtp = async () => {
    setLoading(true);
    setError("");

    try {
      await http.post("/otp/verifyOtp", {
        email: email.trim().toLowerCase(),
        otp,
      });
      setVerified(true);
    } catch (verifyError) {
      setError(getApiErrorMessage(verifyError));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!verified) {
      setError("Verify OTP first.");
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await http.post("/auth/resetpassword", {
        email: email.trim().toLowerCase(),
        newPassword,
        isConformed: true,
      });
      sessionStorage.removeItem("nutricare_reset_email");
      navigate("/login");
    } catch (resetError) {
      setError(getApiErrorMessage(resetError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
          Reset Password
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Verify OTP and continue</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="input mt-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">OTP</label>
            <div className="mt-2 flex gap-3">
              <input
                className="input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
              />
              <button type="button" className="btn-secondary" onClick={verifyOtp}>
                {verified ? "Verified" : "Verify OTP"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              className="input mt-2"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              className="input mt-2"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button onClick={resetPassword} disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Submitting..." : "Reset password"}
        </button>
      </div>
    </div>
  );
}
