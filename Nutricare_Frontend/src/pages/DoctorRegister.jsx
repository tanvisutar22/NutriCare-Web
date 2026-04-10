import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../shared/api/http";
import Loader from "../components/Loader";

function InlineAlert({ children }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

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
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,#071229_0%,#0f2457_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-5xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,23,53,0.96),rgba(17,46,99,0.92))] p-10 shadow-[0_28px_90px_-42px_rgba(2,6,23,0.95)] lg:block">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            Doctor Workspace
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em] text-white">
            Create your
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              doctor account
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Start your doctor access with secure OTP verification and join the NutriCare professional workflow.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Step 1</div>
              <div className="mt-3 text-base font-semibold text-white">Enter account details</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Step 2</div>
              <div className="mt-3 text-base font-semibold text-white">Verify OTP and continue</div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_26px_80px_-42px_rgba(15,23,42,0.45)] sm:p-9">
          {loading ? <Loader /> : null}

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                {step === 1 ? "Doctor signup" : "Verify OTP"}
              </h2>
              <p className="mt-2 text-base text-slate-600">
                {step === 1
                  ? "Create your doctor account using OTP verification."
                  : `OTP sent to ${email}. Enter it below to continue.`}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Step {step} of 2
            </div>
          </div>

          {message ? <div className="mt-6"><InlineAlert>{message}</InlineAlert></div> : null}

          {step === 1 ? (
            <div className="mt-8 space-y-5">
              <Field label="Email">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </Field>

              <Field label="Confirm password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </Field>

              <button
                onClick={sendOtp}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.7)] transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={loading}
              >
                Send OTP
              </button>

              <div className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/doctor/login" className="font-semibold text-cyan-700 hover:underline">
                  Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              <Field label="One-time password">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </Field>

              <button
                onClick={verifyOtp}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.7)] transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={loading}
              >
                Verify & Register
              </button>

              <button
                onClick={() => setStep(1)}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                disabled={loading}
                type="button"
              >
                Back
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
