import { http } from "../../shared/api/http";

export async function getMyProfile() {
  const res = await http.get("/users/me");
  return res.data;
}

export async function createUserProfile(payload) {
  const res = await http.post("/users", payload);
  return res.data;
}

export async function updateMyProfile(payload) {
  const res = await http.put("/users/me", payload);
  return res.data;
}

export async function listApprovedDoctors() {
  const res = await http.get("/users/doctors");
  return res.data;
}

export async function getMyAssignedDoctor() {
  const res = await http.get("/users/my-doctor");
  return res.data;
}

export async function bookDoctor(payload) {
  const res = await http.post("/users/my-doctor", payload);
  return res.data;
}
