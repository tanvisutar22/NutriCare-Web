import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  computePayouts,
  getAdminWalletOverview,
  initiateDoctorPayoutPayment,
  listDoctorsAdmin,
  payDoctor,
  setDoctorApprovalAdmin,
  verifyDoctorPayoutPayment,
} from "./adminApi";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

function currency(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-white/8 border-white/10 text-slate-200",
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
    <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,34,74,0.96),rgba(10,24,53,0.98))] p-5 shadow-[0_20px_60px_-35px_rgba(2,6,23,0.95)]">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-300">{subtitle}</div> : null}
    </div>
  );
}

function Pill({ children, variant = "neutral" }) {
  const styles = {
    neutral: "border-white/10 bg-white/8 text-slate-100",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
}

function payoutStatusVariant(row) {
  if (!Number(row?.payout?.totalAmount || 0)) return "neutral";
  return row?.payout?.status === "paid" ? "good" : "warn";
}

function payoutStatusLabel(row) {
  if (!Number(row?.payout?.totalAmount || 0)) return "No payout";
  return row?.payout?.status === "paid" ? "Paid" : "Pending";
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
    () => doctors.filter((row) => row.doctor?.isApproved).length,
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
      await loadRazorpayScript();
      const init = await initiateDoctorPayoutPayment(doctorAuthId, monthKey, "Admin payout processed");
      const paymentIntent = init?.data;

      if (!paymentIntent?.orderId || !paymentIntent?.keyId || !window.Razorpay) {
        throw new Error("Razorpay payout order setup failed.");
      }

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: paymentIntent.keyId,
          amount: Number(paymentIntent.amount) * 100,
          currency: paymentIntent.currency || "INR",
          name: "NutriCare Admin",
          description: `Doctor payout for ${paymentIntent.monthKey}`,
          order_id: paymentIntent.orderId,
          handler: async (gatewayResponse) => {
            try {
              const verify = await verifyDoctorPayoutPayment(doctorAuthId, {
                monthKey,
                notes: "Admin payout processed",
                ...gatewayResponse,
              });
              setSuccess(verify?.message || "Doctor payout completed");
              resolve(verify);
            } catch (requestError) {
              reject(requestError);
            }
          },
          theme: { color: "#0f766e" },
          modal: {
            ondismiss: () => reject(new Error("Payout payment cancelled.")),
          },
        });

        razorpay.on("payment.failed", (event) => {
          reject(new Error(event?.error?.description || "Payout payment failed."));
        });

        razorpay.open();
      });

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
          <h2 className="text-3xl font-bold text-white">Admin panel</h2>
          <p className="mt-1 text-slate-300">
            Review doctors, wallet collections, and doctor payouts based on assigned subscribed patients.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || busy}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Wallet balance" value={currency(walletOverview?.walletBalance)} />
        <StatCard label="Total collections" value={currency(walletOverview?.totalCollections)} />
        <StatCard label="Pending doctors" value={walletOverview?.pendingDoctors || 0} />
        <StatCard label="Approved doctors" value={approvedCount} subtitle={`${doctors.length} total doctors`} />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white">Doctor approval queue</h3>
        <p className="mt-1 text-sm text-slate-300">
          Doctors need a complete profile and admin approval before accessing the full dashboard.
        </p>

        {loading ? (
          <div className="mt-5 text-sm text-slate-300">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="mt-5 text-sm text-slate-300">No doctors found.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="py-2 pr-3">Doctor</th>
                  <th className="py-2 pr-3">Specialization</th>
                  <th className="py-2 pr-3">Assigned patients</th>
                  <th className="py-2 pr-3">Total earned</th>
                  <th className="py-2 pr-3">Unpaid</th>
                  <th className="py-2 pr-3">Approval</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((row) => (
                  <tr key={row.doctor?._id || row.doctorAuthId} className="border-t border-white/10 text-slate-200">
                    <td className="py-3 pr-3 text-white">{row.doctor?.name || "-"}</td>
                    <td className="py-3 pr-3 text-slate-200">{row.doctor?.specialization || "-"}</td>
                    <td className="py-3 pr-3">{row.assignedPatientsCount ?? 0}</td>
                    <td className="py-3 pr-3">{currency(row.totalEarned)}</td>
                    <td className="py-3 pr-3">{currency(row.unpaidAmount)}</td>
                    <td className="py-3 pr-3">
                      {row.doctor?.isApproved ? <Pill variant="good">Approved</Pill> : <Pill variant="warn">Pending</Pill>}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className={row.doctor?.isApproved ? "btn-secondary" : "btn-primary"}
                        disabled={busy}
                        onClick={() => toggleApproval(row.doctorAuthId, !row.doctor?.isApproved)}
                      >
                        {row.doctor?.isApproved ? "Revoke" : "Approve"}
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
              <h3 className="text-lg font-semibold text-white">Monthly payouts</h3>
              <p className="mt-1 text-sm text-slate-300">
                Compute doctor payouts from paid subscriptions linked to each selected doctor.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="text-sm font-medium text-slate-200">Month</label>
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
            <div className="mt-5 text-sm text-slate-300">No payout data yet. Click Compute.</div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-300">
                    <th className="py-2 pr-3">Doctor</th>
                    <th className="py-2 pr-3">Assigned</th>
                    <th className="py-2 pr-3">Monthly patients</th>
                    <th className="py-2 pr-3">Monthly payout</th>
                    <th className="py-2 pr-3">Paid this month</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((row) => (
                    <tr key={String(row.doctorAuthId)} className="border-t border-white/10 text-slate-200">
                      <td className="py-3 pr-3 text-white">{row.doctor?.name || "-"}</td>
                      <td className="py-3 pr-3">{row.assignedPatientsCount ?? 0}</td>
                      <td className="py-3 pr-3">{row.payout?.patientCount ?? 0}</td>
                      <td className="py-3 pr-3">{currency(row.payout?.totalAmount)}</td>
                      <td className="py-3 pr-3">
                        <div>{currency(row.paidAmount)}</div>
                        <div className="text-xs text-slate-400">
                          All time {currency(row.allTimePaidAmount)}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <Pill variant={payoutStatusVariant(row)}>{payoutStatusLabel(row)}</Pill>
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={busy || row.payout?.status === "paid" || !row.payout?.totalAmount}
                          onClick={() => pay(row.doctorAuthId)}
                        >
                          {!row.payout?.totalAmount ? "No dues" : row.payout?.status === "paid" ? "Paid" : "Pay Now"}
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
          <h3 className="text-lg font-semibold text-white">Admin wallet history</h3>
          <div className="mt-4 space-y-3">
            {walletOverview?.walletTransactions?.length ? (
              walletOverview.walletTransactions.slice(0, 8).map((transaction) => (
                <div key={transaction._id} className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{transaction.type}</span>
                    <span className="text-slate-200">{currency(transaction.amount)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No admin wallet transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
