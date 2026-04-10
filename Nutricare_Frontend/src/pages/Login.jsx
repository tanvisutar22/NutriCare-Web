import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) return setError("Email is required");
    if (!password.trim()) return setError("Password is required");

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials or server error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,#071229_0%,#0f2457_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_0.92fr]">
        <section className="hidden rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,23,53,0.96),rgba(17,46,99,0.92))] p-10 shadow-[0_28px_90px_-42px_rgba(2,6,23,0.95)] lg:block">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            NutriCare
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em] text-white">
            Welcome back to
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              NutriCare AI
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Log in to continue your health journey, review your dashboard, and stay connected to your diet and wellness progress.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "Track weight and activity",
              "Manage goals and daily logs",
              "Review progress and diet plans",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[26px] border border-white/10 bg-white/6 p-4 text-sm font-medium text-slate-100 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_26px_80px_-42px_rgba(15,23,42,0.45)] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                Login
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Enter your credentials to continue.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Secure Access
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 space-y-5">
            <Field label="Email">
              <input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-900"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.7)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/forgot-password"
                className="font-medium text-cyan-700 transition hover:text-cyan-900 hover:underline"
              >
                Forgot Password?
              </Link>
              <Link
                to="/register"
                className="font-medium text-slate-700 transition hover:text-slate-900 hover:underline"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
