import { http } from "../../shared/api/http";

export async function submitDailyLog(input, history = []) {
  const res = await http.post("/ai/logs", { input, history });
  return res.data;
}

