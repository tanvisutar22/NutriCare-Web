import { http } from "../../shared/api/http";

export async function getStreak(year, month) {
  const res = await http.get("/dashboard/streak", { params: { year, month } });
  return res.data;
}

export async function getWeight(year, month) {
  const res = await http.get("/dashboard/weight", { params: { year, month } });
  return res.data;
}

export async function getHealthRisk() {
  const res = await http.get("/dashboard/health-risk");
  return res.data;
}

export async function getIntakeActivity(year, month) {
  const res = await http.get("/dashboard/intake-activity", { params: { year, month } });
  return res.data;
}

