import { http } from "../../shared/api/http";

export async function listMealLogs(params) {
  const res = await http.get("/meal-logs", { params });
  return res.data;
}

export async function getMealLogSummary(params) {
  const res = await http.get("/meal-logs/summary", { params });
  return res.data;
}

export async function saveMealLog(payload) {
  const res = await http.post("/meal-logs", payload);
  return res.data;
}
