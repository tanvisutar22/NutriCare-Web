import http from "../shared/api/http";

export async function listDoctorsAdmin() {
  const res = await http.get("/admin/doctors");
  return res.data;
}

export async function setDoctorApprovalAdmin(doctorAuthId, isApproved) {
  const res = await http.patch(`/admin/doctors/${doctorAuthId}/approval`, {
    isApproved,
  });
  return res.data;
}

export async function computePayouts(monthKey) {
  const res = await http.get("/admin/payouts", {
    params: { monthKey },
  });
  return res.data;
}

export async function payDoctor(doctorAuthId, monthKey) {
  const res = await http.post(`/admin/payouts/${doctorAuthId}/pay`, { monthKey });
  return res.data;
}

