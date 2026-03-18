import { http } from "../../shared/api/http";

export async function listBodyMetrics({ metricType } = {}) {
  const res = await http.get("/body-metrics", {
    params: metricType ? { metricType } : undefined,
  });
  return res.data; // ApiResponse
}

export async function createBodyMetric(payload) {
  const res = await http.post("/body-metrics", payload);
  return res.data; // ApiResponse
}

export async function updateBodyMetric(id, payload) {
  const res = await http.put(`/body-metrics/${id}`, payload);
  return res.data; // ApiResponse
}

export async function deleteBodyMetric(id) {
  const res = await http.delete(`/body-metrics/${id}`);
  return res.data; // ApiResponse
}

