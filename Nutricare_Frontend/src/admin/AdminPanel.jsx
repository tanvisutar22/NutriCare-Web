import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  computePayouts,
  listDoctorsAdmin,
  payDoctor,
  setDoctorApprovalAdmin,
} from "./adminApi";

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={`mt-4 rounded-xl border p-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

function monthKeyNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function Pill({ children, variant = "neutral" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
}

export default function AdminPanel() {
  const [doctors, setDoctors] = useState([]);
  const [monthKey, setMonthKey] = useState(monthKeyNow());
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const approvedCount = useMemo(
    () => doctors.filter((d) => d.isApproved).length,
    [doctors],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await listDoctorsAdmin();
      setDoctors(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleApproval = async (authId, isApproved) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await setDoctorApprovalAdmin(authId, isApproved);
      setSuccess(res?.message || "Updated");
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const runCompute = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await computePayouts(monthKey);
      setPayouts(Array.isArray(res?.data) ? res.data : []);
      setSuccess(res?.message || "Computed payouts");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pay = async (doctorAuthId) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await payDoctor(doctorAuthId, monthKey);
      setSuccess(res?.message || "Paid");
      await runCompute();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin panel</h2>
          <p className="mt-1 text-slate-600">
            Approve doctors and process monthly payouts.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || busy}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total doctors</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{doctors.length}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Approved doctors</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{approvedCount}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Fee per patient</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">₹250</div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Doctor approvals</h3>
        <p className="mt-1 text-sm text-slate-600">
          Only approved doctors will receive review requests.
        </p>

        {loading ? (
          <div className="mt-5 text-sm text-slate-700">Loading…</div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 text-sm text-slate-600">No doctors found.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Specialization</th>
                  <th className="py-2 pr-3">Approved</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d._id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 text-slate-900">{d.name}</td>
                    <td className="py-3 pr-3 text-slate-700">{d.specialization || "—"}</td>
                    <td className="py-3 pr-3">
                      {d.isApproved ? <Pill variant="good">Approved</Pill> : <Pill variant="warn">Pending</Pill>}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className={d.isApproved ? "btn-secondary" : "btn-primary"}
                        disabled={busy}
                        onClick={() => toggleApproval(d.authId, !d.isApproved)}
                      >
                        {d.isApproved ? "Revoke" : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Monthly payouts</h3>
            <p className="mt-1 text-sm text-slate-600">
              Compute patient counts per doctor and pay monthly fees.
            </p>
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700">Month</label>
              <input
                className="input mt-2"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>
            <button className="btn-primary" type="button" onClick={runCompute} disabled={busy}>
              {busy ? "Working..." : "Compute"}
            </button>
          </div>
        </div>

        {payouts.length === 0 ? (
          <div className="mt-5 text-sm text-slate-600">No payout data yet. Click Compute.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Doctor</th>
                  <th className="py-2 pr-3">Patients</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((row) => (
                  <tr key={String(row.doctorAuthId)} className="border-t border-slate-100">
                    <td className="py-3 pr-3 text-slate-900">{row.doctor?.name || "—"}</td>
                    <td className="py-3 pr-3">{row.payout?.patientCount ?? 0}</td>
                    <td className="py-3 pr-3">₹{row.payout?.totalAmount ?? 0}</td>
                    <td className="py-3 pr-3">
                      {row.payout?.status === "paid" ? <Pill variant="good">Paid</Pill> : <Pill variant="warn">Pending</Pill>}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || row.payout?.status === "paid"}
                        onClick={() => pay(row.doctorAuthId)}
                      >
                        {row.payout?.status === "paid" ? "Paid" : "Pay"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

