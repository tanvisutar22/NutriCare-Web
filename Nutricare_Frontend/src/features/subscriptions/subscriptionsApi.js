import { http } from "../../shared/api/http";

export async function getSubscriptionPlans() {
  const res = await http.get("/subscriptions/plans");
  return res.data;
}

export async function getMySubscription() {
  const res = await http.get("/subscriptions/me");
  return res.data;
}

export async function getMySubscriptionHistory() {
  const res = await http.get("/subscriptions/history");
  return res.data;
}

export async function purchaseSubscription(payload) {
  const res = await http.post("/subscriptions/purchase", payload);
  return res.data;
}

export async function createMockPaymentIntent(payload) {
  const res = await http.post("/subscriptions/payments/initiate", payload);
  return res.data;
}

export async function verifyMockPayment(payload) {
  const res = await http.post("/subscriptions/payments/verify", payload);
  return res.data;
}
