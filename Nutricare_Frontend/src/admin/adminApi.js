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

export async function getAdminWalletOverview() {
  const res = await http.get("/admin/wallet");
  return res.data;
}

export async function computePayouts(monthKey) {
  const res = await http.get("/admin/payouts", {
    params: { monthKey },
  });
  return res.data;
}

export async function payDoctor(doctorAuthId, monthKey, notes = "") {
  const res = await http.post(`/admin/payouts/${doctorAuthId}/pay`, {
    monthKey,
    notes,
  });
  return res.data;
}

export async function initiateDoctorPayoutPayment(doctorAuthId, monthKey, notes = "") {
  const res = await http.post(`/admin/payouts/${doctorAuthId}/initiate-payment`, {
    monthKey,
    notes,
  });
  return res.data;
}

export async function verifyDoctorPayoutPayment(doctorAuthId, payload) {
  const res = await http.post(`/admin/payouts/${doctorAuthId}/verify-payment`, payload);
  return res.data;
}
