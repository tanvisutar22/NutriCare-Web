import { http } from "../../shared/api/http";

export async function submitDailyLog(input, history = []) {
  const res = await http.post("/ai/logs", { input, history });
  return res.data;
}

export async function getChatHistory() {
  const res = await http.get("/ai/chat/history");
  return res.data;
}

export async function sendChatMessage(payload) {
  const res = await http.post("/ai/chat", payload);
  return res.data;
}
