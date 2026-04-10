import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import { listMyDoctorNotes } from "../features/notes/notesApi";
import { useAuth } from "../context/AuthContext";

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`mt-4 rounded-xl border p-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function Notes() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMyDoctorNotes();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      const message = getApiErrorMessage(e);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        await logout();
        navigate("/login", { replace: true, state: { from: "/notes" } });
        return;
      }
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Doctor notes</h2>
          <p className="mt-1 text-slate-600">
            Reviews and recommendations added by doctors.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}

      {loading ? (
        <div className="text-sm text-slate-700">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card">
          <div className="text-sm text-slate-600">No notes yet.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((n) => (
            <div key={n._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {n.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDateTime(n.createdAt)} • Doctor:{" "}
                    {n.doctorAuthId?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">
                {n.note}
              </div>

              {n.recommendation ? (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 whitespace-pre-wrap">
                  <div className="font-semibold">Recommendation</div>
                  <div className="mt-1">{n.recommendation}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

