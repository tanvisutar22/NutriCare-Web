import Payment from "../models/payment.model.js";

const normalizeId = (value) => (value ? String(value) : "");

export const getDoctorSelectionsForPatients = async (patientAuthIds = []) => {
  const uniqueIds = [...new Set(patientAuthIds.map(normalizeId).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const payments = await Payment.find({
    payerAuthId: { $in: uniqueIds },
    verificationStatus: "verified",
    "meta.selectedDoctorAuthId": { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .select("payerAuthId meta.selectedDoctorAuthId amount createdAt");

  const selections = new Map();
  for (const payment of payments) {
    const patientId = normalizeId(payment.payerAuthId);
    if (!patientId || selections.has(patientId)) continue;

    selections.set(patientId, {
      doctorAuthId: normalizeId(payment?.meta?.selectedDoctorAuthId),
      amount: Number(payment.amount) || 0,
      paidAt: payment.createdAt,
    });
  }

  return selections;
};

export const getDoctorSelectionForPatient = async (patientAuthId) => {
  const selections = await getDoctorSelectionsForPatients([patientAuthId]);
  return selections.get(normalizeId(patientAuthId)) || null;
};

export const isDoctorSelectedForPatient = (selectionMap, patientAuthId, doctorAuthId) => {
  const selection = selectionMap.get(normalizeId(patientAuthId));
  return Boolean(selection && normalizeId(selection.doctorAuthId) === normalizeId(doctorAuthId));
};
