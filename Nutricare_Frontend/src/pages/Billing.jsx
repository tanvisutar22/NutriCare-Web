import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  createMockPaymentIntent,
  getMySubscription,
  getMySubscriptionHistory,
  getSubscriptionPlans,
  verifyMockPayment,
} from "../features/subscriptions/subscriptionsApi";

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "border-slate-200 bg-slate-50 text-slate-700",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function PlanCard({ plan, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={[
        "rounded-3xl border p-6 text-left shadow-sm transition",
        selected
          ? "border-emerald-300 bg-emerald-50 shadow-emerald-100"
          : "border-slate-200 bg-white hover:border-emerald-200",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {plan.label}
      </p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">Rs. {plan.amount}</h3>
      <p className="mt-2 text-sm text-slate-600">
        Valid for {plan.durationDays} days with mock verified payment activation.
      </p>
      <div className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {plan.planType}
      </div>
    </button>
  );
}

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState({ subscriptions: [], payments: [] });
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansRes, subscriptionRes, historyRes] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription(),
        getMySubscriptionHistory(),
      ]);

      const nextPlans = Array.isArray(plansRes?.data) ? plansRes.data : [];
      setPlans(nextPlans);
      setSelectedPlan((current) => current || nextPlans[1] || nextPlans[0] || null);
      setSubscription(subscriptionRes?.data || null);
      setHistory(historyRes?.data || { subscriptions: [], payments: [] });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remainingValidity = useMemo(() => {
    if (!subscription?.remainingDays) return "No active premium plan";
    return `${subscription.remainingDays} days remaining`;
  }, [subscription]);

  const hasActiveSubscription = useMemo(() => {
    if (!subscription?.endDate || subscription?.status !== "active") return false;
    const endDate = new Date(subscription.endDate);
    return !Number.isNaN(endDate.getTime()) && endDate >= new Date();
  }, [subscription]);

  const openGateway = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const response = await createMockPaymentIntent({
        planType: selectedPlan.planType,
        paymentMethod,
      });
      setPaymentIntent(response?.data || null);
      setGatewayOpen(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessing(false);
    }
  };

  const confirmPayment = async (simulateStatus) => {
    if (!paymentIntent?._id) return;
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      const response = await verifyMockPayment({
        paymentId: paymentIntent._id,
        simulateStatus,
      });
      setSuccess(response?.message || "Premium plan updated successfully.");
      setGatewayOpen(false);
      setPaymentIntent(null);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Premium
          </div>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Upgrade to Premium</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Unlock doctor access, advanced review flows, and a structured mock
            payment experience with proper subscription history.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || processing}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Current plan</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {subscription?.planType || "No plan"}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Remaining validity</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{remainingValidity}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Valid until</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "-"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Choose your plan</h3>
            <p className="mt-1 text-sm text-slate-600">
              You can purchase a new plan after your current active subscription ends.
            </p>

            {hasActiveSubscription ? (
              <div className="mt-4">
                <InlineAlert variant="info">
                  You already have an active subscription until{" "}
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "-"}.
                  Upgrade will be available after the current plan ends.
                </InlineAlert>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.planType}
                  plan={plan}
                  selected={selectedPlan?.planType === plan.planType}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Mock payment gateway</h3>
            <p className="mt-1 text-sm text-slate-600">
              This simulates a real payment step before backend verification activates your subscription.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Selected plan</label>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {selectedPlan ? `${selectedPlan.label} - Rs. ${selectedPlan.amount}` : "Choose a plan"}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Payment method</label>
                <select
                  className="input mt-2"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="btn-primary"
                type="button"
                onClick={openGateway}
                disabled={processing || !selectedPlan || hasActiveSubscription}
              >
                {processing ? "Preparing..." : "Pay Now"}
              </button>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Backend verification happens after mock success.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Subscription history</h3>
            {history.subscriptions?.length ? (
              <div className="mt-4 space-y-3">
                {history.subscriptions.slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{item.planType}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-600">
                      {formatDate(item.startDate)} to {formatDate(item.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No subscription history yet.</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Payment records</h3>
            {history.payments?.length ? (
              <div className="mt-4 space-y-3">
                {history.payments.slice(0, 6).map((payment) => (
                  <div key={payment._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">
                        {payment.planType} - Rs. {payment.amount}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-600">
                      Purchased: {formatDate(payment.createdAt)}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Validity: {formatDate(payment.validityStart)} to {formatDate(payment.validityEnd)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No payment records yet.</p>
            )}
          </div>
        </div>
      </div>

      {gatewayOpen && paymentIntent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Mock Payment Gateway</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Review the plan, payment method, and confirm mock verification.
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                onClick={() => setGatewayOpen(false)}
                disabled={processing}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Plan</div>
                <div className="mt-1 font-semibold text-slate-900">{selectedPlan?.label}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Amount</div>
                <div className="mt-1 font-semibold text-slate-900">Rs. {paymentIntent.amount}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Payment method</div>
                <div className="mt-1 font-semibold capitalize text-slate-900">{paymentMethod}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Transaction ID</div>
                <div className="mt-1 font-semibold text-slate-900">{paymentIntent.transactionId}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => confirmPayment("success")}
                disabled={processing}
              >
                {processing ? "Verifying..." : "Simulate Success"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => confirmPayment("failed")}
                disabled={processing}
              >
                Simulate Failure
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
