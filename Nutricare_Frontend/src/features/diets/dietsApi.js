import { http } from "../../shared/api/http";

export async function listDietPlans() {
  const res = await http.get("/diets");
  return res.data;
}

export async function createDietPlan(payload) {
  const res = await http.post("/diets", payload);
  return res.data;
}

export async function getDietPlanById(id) {
  const res = await http.get(`/diets/${id}`);
  return res.data;
}

export async function updateDietStatus(id, status) {
  const res = await http.patch(`/diets/${id}`, { status });
  return res.data;
}

export async function getTodayDietPlan() {
  const res = await http.get("/diets/today");
  return res.data;
}

export async function getDietStreakStats() {
  const res = await http.get("/diets/streaks");
  return res.data;
}

export async function markTodayDietAsFollowed() {
  const res = await http.post("/diets/today/follow");
  return res.data;
}
