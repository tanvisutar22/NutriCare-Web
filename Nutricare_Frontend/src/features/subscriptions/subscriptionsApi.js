import { http } from "../../shared/api/http";

export async function getMySubscription() {
  const res = await http.get("/subscriptions/me");
  return res.data;
}

export async function purchaseSubscription(payload) {
  const res = await http.post("/subscriptions/purchase", payload);
  return res.data;
}

