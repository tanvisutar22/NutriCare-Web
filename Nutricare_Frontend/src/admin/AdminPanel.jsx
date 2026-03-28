import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  computePayouts,
  getAdminWalletOverview,
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
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function StatCard({ label, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

function Pill({ children, variant = "neutral" }) {
  const styles = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
}

export default function AdminPanel() {
  const [doctors, setDoctors] = useState([]);
  const [walletOverview, setWalletOverview] = useState(null);
  const [monthKey, setMonthKey] = useState(monthKeyNow());
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const approvedCount = useMemo(
    () => doctors.filter((doctor) => doctor.isApproved).length,
    [doctors],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const [doctorsRes, walletRes] = await Promise.all([
        listDoctorsAdmin(),
        getAdminWalletOverview(),
      ]);
      setDoctors(Array.isArray(doctorsRes?.data) ? doctorsRes.data : []);
      setWalletOverview(walletRes?.data || null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleApproval = async (doctorAuthId, isApproved) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await setDoctorApprovalAdmin(doctorAuthId, isApproved);
      setSuccess(response?.message || "Doctor approval updated");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const runCompute = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await computePayouts(monthKey);
      setPayouts(Array.isArray(response?.data) ? response.data : []);
      setSuccess(response?.message || "Payouts computed");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const pay = async (doctorAuthId) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await payDoctor(doctorAuthId, monthKey, "Admin payout processed");
      setSuccess(response?.message || "Doctor payout completed");
      await Promise.all([load(), runCompute()]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin panel</h2>
          <p className="mt-1 text-slate-600">
            Review pending doctors, track collections, and process doctor payouts.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || busy}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Wallet balance" value={`Rs. ${walletOverview?.walletBalance || 0}`} />
        <StatCard label="Total collections" value={`Rs. ${walletOverview?.totalCollections || 0}`} />
        <StatCard label="Pending doctors" value={walletOverview?.pendingDoctors || 0} />
        <StatCard label="Approved doctors" value={approvedCount} subtitle={`${doctors.length} total doctors`} />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Doctor approval queue</h3>
        <p className="mt-1 text-sm text-slate-600">
          Doctors need a complete profile and admin approval before accessing the full dashboard.
        </p>

        {loading ? (
          <div className="mt-5 text-sm text-slate-700">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 text-sm text-slate-600">No doctors found.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Doctor</th>
                  <th className="py-2 pr-3">Specialization</th>
                  <th className="py-2 pr-3">Qualification</th>
                  <th className="py-2 pr-3">Profile</th>
                  <th className="py-2 pr-3">Approval</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor._id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 text-slate-900">{doctor.name}</td>
                    <td className="py-3 pr-3 text-slate-700">{doctor.specialization || "-"}</td>
                    <td className="py-3 pr-3 text-slate-700">{doctor.qualification || "-"}</td>
                    <td className="py-3 pr-3">
                      {doctor.profileComplete ? <Pill variant="good">Complete</Pill> : <Pill variant="warn">Incomplete</Pill>}
                    </td>
                    <td className="py-3 pr-3">
                      {doctor.isApproved ? <Pill variant="good">Approved</Pill> : <Pill variant="warn">Pending</Pill>}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className={doctor.isApproved ? "btn-secondary" : "btn-primary"}
                        disabled={busy}
                        onClick={() => toggleApproval(doctor.authId, !doctor.isApproved)}
                      >
                        {doctor.isApproved ? "Revoke" : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Monthly payouts</h3>
              <p className="mt-1 text-sm text-slate-600">
                Compute doctor earnings from monthly patient review activity.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Month</label>
                <input
                  className="input mt-2"
                  value={monthKey}
                  onChange={(event) => setMonthKey(event.target.value)}
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
                      <td className="py-3 pr-3 text-slate-900">{row.doctor?.name || "-"}</td>
                      <td className="py-3 pr-3">{row.payout?.patientCount ?? 0}</td>
                      <td className="py-3 pr-3">Rs. {row.payout?.totalAmount ?? 0}</td>
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

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Admin wallet history</h3>
          <div className="mt-4 space-y-3">
            {walletOverview?.walletTransactions?.length ? (
              walletOverview.walletTransactions.slice(0, 8).map((transaction) => (
                <div key={transaction._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{transaction.type}</span>
                    <span className="text-slate-600">Rs. {transaction.amount}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No admin wallet transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
