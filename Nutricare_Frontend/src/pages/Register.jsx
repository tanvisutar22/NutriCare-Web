import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../shared/api/http";
import Loader from "../components/Loader";

function InlineAlert({ variant = "error", children }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant] || styles.error}`}>
      {children}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const passwordMismatch = useMemo(
    () => Boolean(confirmPassword) && password !== confirmPassword,
    [password, confirmPassword],
  );

  const sendOtp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError("Please complete email, password, and confirm password.");
      return;
    }

    if (passwordMismatch) {
      setError("Password and confirm password must match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/otp/sendOtp", { email: email.trim() });
      setStep(2);
      setSuccess("OTP sent successfully. Please enter the code to finish registration.");
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/otp/verifyOtp", { email: email.trim(), otp: otp.trim() });
      await api.post("/auth/register", {
        email: email.trim(),
        password,
        conformPassword: confirmPassword,
        userType: "User",
      });

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP or registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {loading ? <Loader /> : null}

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-[linear-gradient(140deg,rgba(16,185,129,0.16),rgba(255,255,255,0.96),rgba(56,189,248,0.14))] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            NutriCare
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Create your user account
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Join NutriCare to unlock diet planning, tracking, premium subscriptions, and doctor-connected health guidance.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Step 1</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Enter account details</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Step 2</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Verify OTP and finish</div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 1 ? "Register" : "Verify OTP"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {step === 1
                  ? "Use your email and password to request an OTP."
                  : `OTP sent to ${email}. Enter it below to complete registration.`}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Step {step} of 2
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
            {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}
          </div>

          {step === 1 ? (
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input mt-2"
                  type="email"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className="input mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    className={`input mt-2 ${passwordMismatch ? "border-red-300 focus:ring-red-200" : ""}`}
                  />
                </div>
              </div>

              {passwordMismatch ? (
                <p className="text-sm text-red-600">Password and confirm password must match.</p>
              ) : null}

              <button onClick={sendOtp} className="btn-primary w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">One-time password</label>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  className="input mt-2"
                  inputMode="numeric"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={verifyOtp} className="btn-primary flex-1" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-medium text-emerald-700 hover:underline" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
