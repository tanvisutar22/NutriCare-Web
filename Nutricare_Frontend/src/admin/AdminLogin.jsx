import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { adminLoginThunk } from "../store/slices/adminAuthSlice";

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.adminAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminLoginThunk({ email, password }));
    if (adminLoginThunk.fulfilled.match(result)) {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-7">
        <h1 className="text-2xl font-bold text-slate-900">Admin login</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage doctors, approvals, and payouts.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="input mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="input mt-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600">
          Back to{" "}
          <Link className="text-teal-700 hover:underline" to="/">
            user app
          </Link>
        </div>
      </div>
    </div>
  );
}

