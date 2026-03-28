import http from "../shared/api/http";

export async function getDoctorDashboard() {
  const res = await http.get("/doctors/dashboard");
  return res.data;
}

export async function getAssignedPatients() {
  const res = await http.get("/doctors/patients");
  return res.data;
}

export async function listReviewRequests({ status } = {}) {
  const res = await http.get("/doctors/review-requests", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function commitReviewRequest(requestId, payload) {
  const res = await http.post(`/doctors/review-requests/${requestId}/commit`, payload);
  return res.data;
}

export async function getPatientDetails(patientAuthId) {
  const res = await http.get(`/doctors/patients/${patientAuthId}/details`);
  return res.data;
}

export async function createDoctorNote(payload) {
  const res = await http.post("/doctors/notes", payload);
  return res.data;
}

export async function getDoctorWallet() {
  const res = await http.get("/doctors/wallet");
  return res.data;
}

export async function getDoctorProfile() {
  const res = await http.get("/doctors/profile");
  return res.data;
}

export async function createDoctorProfile(payload) {
  const res = await http.post("/doctors/profile", payload);
  return res.data;
}

