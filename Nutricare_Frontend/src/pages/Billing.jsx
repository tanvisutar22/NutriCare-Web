import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  createSubscriptionPaymentIntent,
  getMySubscription,
  getMySubscriptionHistory,
  getSubscriptionPlans,
  verifySubscriptionPayment,
} from "../features/subscriptions/subscriptionsApi";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), {
        once: true,
      });
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
          ? "border-cyan-300 bg-[linear-gradient(180deg,rgba(18,48,102,0.98),rgba(10,26,58,0.98))] shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_24px_60px_-30px_rgba(6,182,212,0.6)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(17,34,74,0.92),rgba(10,24,53,0.96))] hover:border-cyan-300/30",
      ].join(" ")}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${selected ? "text-cyan-100" : "text-slate-400"}`}>
        {plan.label}
      </p>
      <h3 className={`mt-3 text-3xl font-bold ${selected ? "text-white" : "text-slate-100"}`}>Rs. {plan.amount}</h3>
      <p className={`mt-2 text-sm ${selected ? "text-slate-200" : "text-slate-300"}`}>
        Valid for {plan.durationDays} days with secure Razorpay payment activation.
      </p>
      <div
        className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          selected
            ? "bg-cyan-300/18 text-cyan-100 ring-1 ring-cyan-300/30"
            : "bg-white/10 text-slate-200 ring-1 ring-white/10"
        }`}
      >
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
      await loadRazorpayScript();

      const response = await createSubscriptionPaymentIntent({
        planType: selectedPlan.planType,
        paymentMethod,
      });
      const intent = response?.data || null;

      if (!intent?.orderId || !intent?.keyId || !window.Razorpay) {
        throw new Error("Razorpay order setup failed.");
      }

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: intent.keyId,
          amount: Number(intent.amount) * 100,
          currency: intent.currency || "INR",
          name: "NutriCare",
          description: `${selectedPlan.label} subscription`,
          order_id: intent.orderId,
          config: {
            display: {
              blocks: {
                upi_first: {
                  name: "Pay via UPI",
                  instruments: [
                    {
                      method: "upi",
                    },
                  ],
                },
              },
              sequence: ["block.upi_first"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          handler: async (gatewayResponse) => {
            try {
              const verifyResponse = await verifySubscriptionPayment({
                paymentId: intent._id,
                ...gatewayResponse,
              });
              setSuccess(
                verifyResponse?.message || "Premium plan updated successfully.",
              );
              await load();
              resolve(verifyResponse);
            } catch (requestError) {
              reject(requestError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
          prefill: {},
          notes: {
            paymentId: intent._id,
            planType: selectedPlan.planType,
          },
          theme: {
            color: "#0f766e",
          },
        });

        razorpay.on("payment.failed", (event) => {
          const reason =
            event?.error?.description ||
            event?.error?.reason ||
            "Payment failed. Please try again.";
          reject(new Error(reason));
        });

        razorpay.open();
      });
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
            Unlock doctor access, advanced review flows, and a secure Razorpay
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
            <h3 className="text-lg font-semibold text-slate-900">Razorpay payment gateway</h3>
            <p className="mt-1 text-sm text-slate-600">
              Your payment is completed in Razorpay Checkout and then verified on the backend before activating your subscription.
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
                {processing ? "Opening Razorpay..." : "Pay with Razorpay"}
              </button>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Backend verification happens automatically after successful Razorpay payment.
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
    </div>
  );
}
