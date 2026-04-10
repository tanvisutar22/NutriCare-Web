import AdminWalletTransaction from "../models/adminWalletTransaction.model.js";
import Doctor from "../models/doctor.model.js";
import DoctorMonthlyPayout from "../models/doctorMonthlyPayout.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import Payment from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getDoctorSelectionsForPatients } from "../utils/doctorSelection.js";
import {
  createRazorpayOrder,
  getRazorpayCheckoutConfig,
  verifyRazorpaySignature,
} from "../services/payment.service.js";

const normalizeId = (value) => (value ? String(value) : "");
const DOCTOR_PAYOUT_RATES = {
  weekly: 100,
  monthly: 250,
};

const parseMonthKey = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const [year, month] = monthKey.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return { year, month };
};

const monthRange = ({ year, month }) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const computeAdminWalletBalance = (transactions = []) =>
  transactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === "credit_subscription") return acc + amount;
    if (transaction.type === "debit_doctor_payout") return acc - amount;
    return acc;
  }, 0);

const getDoctorFeeForPayment = (payment) =>
  Number(DOCTOR_PAYOUT_RATES[payment?.planType] || 0);

const buildAdminWalletSnapshot = ({ payments = [], payouts = [] }) => {
  const totalCollections = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const totalPaidOut = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + Number(payout.totalAmount || 0), 0);

  return {
    totalCollections,
    totalPaidOut,
    walletBalance: Math.max(totalCollections - totalPaidOut, 0),
  };
};

const finalizeDoctorPayout = async ({
  payout,
  adminAuthId,
  doctorAuthId,
  monthKey,
  notes = "",
  gateway = null,
}) => {
  payout.status = "paid";
  payout.paidAt = new Date();
  payout.paidByAdminAuthId = adminAuthId;
  payout.gatewayMeta = {
    ...(payout.gatewayMeta || {}),
    ...(gateway || {}),
  };
  await payout.save();

  const adminWalletTx = await AdminWalletTransaction.create({
    adminAuthId,
    type: "debit_doctor_payout",
    amount: payout.totalAmount,
    referenceType: "DoctorMonthlyPayout",
    referenceId: payout._id,
    meta: {
      doctorAuthId,
      monthKey,
      notes,
      ...(gateway || {}),
    },
  });

  const doctorWalletTx = await DoctorWalletTransaction.create({
    doctorAuthId,
    type: "credit_payout",
    amount: payout.totalAmount,
    referenceType: "DoctorMonthlyPayout",
    referenceId: payout._id,
    meta: {
      monthKey,
      notes,
      ...(gateway || {}),
    },
  });

  return { payout, adminWalletTransaction: adminWalletTx, doctorWalletTransaction: doctorWalletTx };
};

const buildDoctorEarnings = async ({ monthKey = null } = {}) => {
  const doctors = await Doctor.find({}).sort({ createdAt: -1 });
  const activeMappings = await DoctorPatient.find({ status: "active" }).sort({ createdAt: -1 });
  const patientSelections = await getDoctorSelectionsForPatients(
    activeMappings.map((mapping) => mapping.patientAuthId),
  );
  const verifiedPayments = await Payment.find({
    verificationStatus: "verified",
    "meta.selectedDoctorAuthId": { $exists: true, $ne: null },
  }).sort({ createdAt: -1 });

  const paidPayouts = await DoctorMonthlyPayout.find({ status: "paid" });
  const totalPaidByDoctor = paidPayouts.reduce((acc, payout) => {
    const doctorId = normalizeId(payout.doctorAuthId);
    acc.set(doctorId, (acc.get(doctorId) || 0) + Number(payout.totalAmount || 0));
    return acc;
  }, new Map());

  let monthlyPayments = verifiedPayments;
  if (monthKey) {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      throw new ApiError(400, "monthKey must be YYYY-MM");
    }

    const { start, end } = monthRange(parsed);
    monthlyPayments = verifiedPayments.filter((payment) => {
      const createdAt = new Date(payment.createdAt);
      return createdAt >= start && createdAt <= end;
    });
  }

  return doctors.map((doctor) => {
    const doctorId = normalizeId(doctor.authId);
    const assignedPatients = activeMappings.filter(
      (mapping) =>
        normalizeId(mapping.doctorAuthId) === doctorId &&
        patientSelections.get(normalizeId(mapping.patientAuthId))?.doctorAuthId === doctorId,
    );

    const patientIds = assignedPatients.map((mapping) => normalizeId(mapping.patientAuthId));
    const uniquePatientIds = [...new Set(patientIds)];
    const doctorPayments = verifiedPayments.filter(
      (payment) => normalizeId(payment?.meta?.selectedDoctorAuthId) === doctorId,
    );
    const totalEarned = doctorPayments.reduce(
      (sum, payment) => sum + getDoctorFeeForPayment(payment),
      0,
    );
    const totalPaid = totalPaidByDoctor.get(doctorId) || 0;
    const totalUnpaid = Math.max(totalEarned - totalPaid, 0);

    const monthPaymentRows = monthlyPayments.filter(
      (payment) => normalizeId(payment?.meta?.selectedDoctorAuthId) === doctorId,
    );
    const monthPatientIds = [...new Set(monthPaymentRows.map((payment) => normalizeId(payment.payerAuthId)))];
    const monthlyTotal = monthPaymentRows.reduce(
      (sum, payment) => sum + getDoctorFeeForPayment(payment),
      0,
    );
    const monthPaidAmount = paidPayouts
      .filter(
        (payout) =>
          normalizeId(payout.doctorAuthId) === doctorId &&
          (!monthKey || payout.monthKey === monthKey),
      )
      .reduce((sum, payout) => sum + Number(payout.totalAmount || 0), 0);

    return {
      doctor,
      doctorAuthId: doctor.authId,
      assignedPatientsCount: uniquePatientIds.length,
      paidAmount: totalPaid,
      monthPaidAmount,
      unpaidAmount: totalUnpaid,
      totalEarned,
      monthlyPatientIds: monthPatientIds,
      monthlyTotal,
    };
  });
};

export const listDoctorsForAdmin = async (_req, res) => {
  try {
    const earnings = await buildDoctorEarnings();
    return res
      .status(200)
      .json(new ApiResponse(200, earnings, "Doctors fetched successfully"));
  } catch (error) {
    console.error("Error in listDoctorsForAdmin:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const setDoctorApproval = async (req, res) => {
  try {
    const { doctorAuthId } = req.params;
    const { isApproved } = req.body || {};

    if (typeof isApproved !== "boolean") {
      return res.status(400).json(new ApiError(400, "isApproved must be boolean"));
    }

    const doctor = await Doctor.findOneAndUpdate(
      { authId: doctorAuthId },
      {
        isApproved,
        approvalStatus: isApproved ? "approved" : "pending",
      },
      { new: true },
    );

    if (!doctor) {
      return res.status(404).json(new ApiError(404, "Doctor not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, doctor, "Doctor approval updated"));
  } catch (error) {
    console.error("Error in setDoctorApproval:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const computeMonthlyPayouts = async (req, res) => {
  try {
    const { monthKey } = req.query || {};
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res.status(400).json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const rows = await buildDoctorEarnings({ monthKey });
    const results = [];

    for (const row of rows) {
      const payout = await DoctorMonthlyPayout.findOneAndUpdate(
        { doctorAuthId: row.doctorAuthId, monthKey },
        {
          $setOnInsert: { status: "pending" },
          $set: {
            patientCount: row.monthlyPatientIds.length,
            feePerPatient: row.monthlyPatientIds.length
              ? Number((row.monthlyTotal / row.monthlyPatientIds.length).toFixed(2))
              : 0,
            totalAmount: row.monthlyTotal,
          },
        },
        { new: true, upsert: true },
      );

      results.push({
        doctorAuthId: row.doctorAuthId,
        doctor: row.doctor,
        payout,
        assignedPatientsCount: row.assignedPatientsCount,
        totalEarned: row.totalEarned,
        paidAmount: row.monthPaidAmount,
        allTimePaidAmount: row.paidAmount,
        unpaidAmount: row.unpaidAmount,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, results, "Monthly payouts computed"));
  } catch (error) {
    console.error("Error in computeMonthlyPayouts:", error);
    return res.status(500).json(new ApiError(error.statusCode || 500, error.message || "Internal Server Error"));
  }
};

export const payDoctorMonthlyPayout = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const { doctorAuthId } = req.params;
    const { monthKey, notes = "" } = req.body || {};

    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res.status(400).json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const payout = await DoctorMonthlyPayout.findOne({ doctorAuthId, monthKey });
    if (!payout) {
      return res.status(404).json(new ApiError(404, "Payout not found"));
    }

    if (payout.status === "paid") {
      return res.status(400).json(new ApiError(400, "Payout already paid"));
    }

    const [walletTransactions, verifiedPayments, paidPayouts] = await Promise.all([
      AdminWalletTransaction.find({}).sort({ createdAt: -1 }),
      Payment.find({ verificationStatus: "verified" }).select("amount"),
      DoctorMonthlyPayout.find({ status: "paid" }).select("totalAmount"),
    ]);
    const walletBalance = buildAdminWalletSnapshot({
      payments: verifiedPayments,
      payouts: paidPayouts,
    }).walletBalance;
    if (walletBalance < payout.totalAmount) {
      return res
        .status(400)
        .json(new ApiError(400, "Insufficient admin wallet balance"));
    }

    const result = await finalizeDoctorPayout({
      payout,
      adminAuthId,
      doctorAuthId,
      monthKey,
      notes,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Payout paid successfully",
      ),
    );
  } catch (error) {
    console.error("Error in payDoctorMonthlyPayout:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const initiateDoctorPayoutPayment = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const { doctorAuthId } = req.params;
    const { monthKey, notes = "" } = req.body || {};

    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res.status(400).json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const payout = await DoctorMonthlyPayout.findOne({ doctorAuthId, monthKey });
    if (!payout) {
      return res.status(404).json(new ApiError(404, "Payout not found"));
    }
    if (payout.status === "paid") {
      return res.status(400).json(new ApiError(400, "Payout already paid"));
    }
    if (!Number(payout.totalAmount)) {
      return res.status(400).json(new ApiError(400, "Payout amount must be greater than zero"));
    }

    const [walletTransactions, verifiedPayments, paidPayouts] = await Promise.all([
      AdminWalletTransaction.find({}).sort({ createdAt: -1 }),
      Payment.find({ verificationStatus: "verified" }).select("amount"),
      DoctorMonthlyPayout.find({ status: "paid" }).select("totalAmount"),
    ]);
    const walletBalance = buildAdminWalletSnapshot({
      payments: verifiedPayments,
      payouts: paidPayouts,
    }).walletBalance;
    if (walletBalance < payout.totalAmount) {
      return res.status(400).json(new ApiError(400, "Insufficient admin wallet balance"));
    }

    const order = await createRazorpayOrder({
      amount: payout.totalAmount,
      currency: "INR",
      receipt: `doc_${String(payout._id).slice(-10)}_${monthKey.replace("-", "")}`,
      notes: {
        doctorAuthId: String(doctorAuthId),
        payoutId: String(payout._id),
        monthKey,
      },
    });

    payout.gatewayMeta = {
      ...(payout.gatewayMeta || {}),
      razorpayOrderId: order.id,
      initiatedByAdminAuthId: String(adminAuthId),
      notes,
    };
    await payout.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          payoutId: payout._id,
          amount: payout.totalAmount,
          currency: order.currency,
          orderId: order.id,
          keyId: getRazorpayCheckoutConfig().keyId,
          doctorAuthId,
          monthKey,
        },
        "Doctor payout payment initiated",
      ),
    );
  } catch (error) {
    console.error("Error in initiateDoctorPayoutPayment:", error);
    return res.status(error?.statusCode || 500).json(
      new ApiError(error?.statusCode || 500, error.message || "Internal Server Error"),
    );
  }
};

export const verifyDoctorPayoutPayment = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const { doctorAuthId } = req.params;
    const {
      monthKey,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      notes = "",
    } = req.body || {};

    const payout = await DoctorMonthlyPayout.findOne({ doctorAuthId, monthKey });
    if (!payout) {
      return res.status(404).json(new ApiError(404, "Payout not found"));
    }
    if (payout.status === "paid") {
      return res.status(400).json(new ApiError(400, "Payout already paid"));
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json(new ApiError(400, "Razorpay verification details are required"));
    }
    if ((payout.gatewayMeta?.razorpayOrderId || "") !== razorpayOrderId) {
      return res.status(400).json(new ApiError(400, "Razorpay order mismatch"));
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    if (!isValid) {
      return res.status(400).json(new ApiError(400, "Invalid Razorpay signature"));
    }

    const result = await finalizeDoctorPayout({
      payout,
      adminAuthId,
      doctorAuthId,
      monthKey,
      notes,
      gateway: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    return res.status(200).json(
      new ApiResponse(200, result, "Doctor payout paid successfully"),
    );
  } catch (error) {
    console.error("Error in verifyDoctorPayoutPayment:", error);
    return res.status(error?.statusCode || 500).json(
      new ApiError(error?.statusCode || 500, error.message || "Internal Server Error"),
    );
  }
};

export const getAdminWalletOverview = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const [walletTransactions, payments, payouts, doctorRows] = await Promise.all([
      AdminWalletTransaction.find({}).sort({ createdAt: -1 }).limit(200),
      Payment.find({ verificationStatus: "verified" }).sort({ createdAt: -1 }).limit(200),
      DoctorMonthlyPayout.find({}).sort({ createdAt: -1 }).limit(200),
      buildDoctorEarnings(),
    ]);

    const walletSnapshot = buildAdminWalletSnapshot({ payments, payouts });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          adminAuthId,
          walletBalance: walletSnapshot.walletBalance,
          totalCollections: walletSnapshot.totalCollections,
          totalPaidOut: walletSnapshot.totalPaidOut,
          pendingDoctors: doctorRows.filter((row) => !row.doctor.isApproved).length,
          walletTransactions,
          payments,
          payouts,
          doctorEarnings: doctorRows,
        },
        "Admin wallet overview fetched",
      ),
    );
  } catch (error) {
    console.error("Error in getAdminWalletOverview:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
