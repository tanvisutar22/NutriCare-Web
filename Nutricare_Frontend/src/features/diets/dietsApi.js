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

export async function updateDietPlanStatus(id, payload) {
  const res = await http.patch(`/diets/${id}`, payload);
  return res.data;
}
