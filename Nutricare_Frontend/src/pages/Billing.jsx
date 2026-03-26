import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  getMySubscription,
  purchaseSubscription,
} from "../features/subscriptions/subscriptionsApi";

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

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [planType, setPlanType] = useState("monthly");
  const [amount, setAmount] = useState("");

  const suggested = useMemo(() => {
    // just UI defaults; backend still accepts any amount (mock)
    return planType === "weekly" ? 199 : 499;
  }, [planType]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMySubscription();
      setSubscription(res?.data || null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onPurchase = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = Number(amount || suggested);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSaving(true);
    try {
      const res = await purchaseSubscription({
        planType,
        amount: parsed,
      });
      setSuccess(res?.message || "Subscription purchased");
      setAmount("");
      await load();
    } catch (e2) {
      setError(getApiErrorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Plans & billing</h2>
          <p className="mt-1 text-slate-600">
            Purchase a plan to unlock doctor review requests on diet generation.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || saving}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Active subscription</h3>
          <p className="mt-1 text-sm text-slate-600">
            This is the subscription used to decide whether doctors receive review requests.
          </p>

          {loading ? (
            <div className="mt-5 text-sm text-slate-700">Loading…</div>
          ) : !subscription ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              No active subscription found.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Plan</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {subscription.planType}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Status</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {subscription.status}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Starts</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(subscription.startDate)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Ends</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(subscription.endDate)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Purchase</h3>
          <p className="mt-1 text-sm text-slate-600">
            Mock payment: amount is recorded and marked paid.
          </p>

          <form onSubmit={onPurchase} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Plan type</label>
                <select
                  className="input mt-2"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                >
                  <option value="weekly">Weekly (7 days)</option>
                  <option value="monthly">Monthly (30 days)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <input
                  className="input mt-2"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Suggested: ${suggested}`}
                  type="number"
                  min={0}
                />
              </div>
            </div>

            <button className="btn-primary" disabled={saving} type="submit">
              {saving ? "Processing..." : "Pay & activate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

