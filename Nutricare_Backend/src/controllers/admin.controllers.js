import AdminWalletTransaction from "../models/adminWalletTransaction.model.js";
import Doctor from "../models/doctor.model.js";
import DoctorMonthlyPayout from "../models/doctorMonthlyPayout.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import Payment from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export const listDoctorsForAdmin = async (_req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
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
      return res
        .status(400)
        .json(new ApiError(400, "isApproved must be boolean"));
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
      return res
        .status(400)
        .json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const { start, end } = monthRange(parsed);
    const approvedDoctors = await Doctor.find({
      isApproved: true,
      approvalStatus: "approved",
      profileComplete: true,
    }).select("authId name specialization qualification consultationFee");

    const results = [];

    for (const doctor of approvedDoctors) {
      const patientIds = await DoctorNote.distinct("patientAuthId", {
        doctorAuthId: doctor.authId,
        createdAt: { $gte: start, $lte: end },
      });

      const patientCount = patientIds.length;
      const feePerPatient = doctor.consultationFee || 250;
      const totalAmount = patientCount * feePerPatient;

      const payout = await DoctorMonthlyPayout.findOneAndUpdate(
        { doctorAuthId: doctor.authId, monthKey },
        {
          $setOnInsert: { status: "pending" },
          $set: { patientCount, feePerPatient, totalAmount },
        },
        { new: true, upsert: true },
      );

      results.push({
        doctorAuthId: doctor.authId,
        doctor,
        payout,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, results, "Monthly payouts computed"));
  } catch (error) {
    console.error("Error in computeMonthlyPayouts:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const payDoctorMonthlyPayout = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const { doctorAuthId } = req.params;
    const { monthKey, notes = "" } = req.body || {};

    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res
        .status(400)
        .json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const payout = await DoctorMonthlyPayout.findOne({ doctorAuthId, monthKey });
    if (!payout) {
      return res.status(404).json(new ApiError(404, "Payout not found"));
    }

    if (payout.status === "paid") {
      return res.status(400).json(new ApiError(400, "Payout already paid"));
    }

    const walletTransactions = await AdminWalletTransaction.find({}).sort({ createdAt: -1 });
    const walletBalance = computeAdminWalletBalance(walletTransactions);
    if (walletBalance < payout.totalAmount) {
      return res
        .status(400)
        .json(new ApiError(400, "Insufficient admin wallet balance"));
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    payout.paidByAdminAuthId = adminAuthId;
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
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          payout,
          adminWalletTransaction: adminWalletTx,
          doctorWalletTransaction: doctorWalletTx,
        },
        "Payout paid successfully",
      ),
    );
  } catch (error) {
    console.error("Error in payDoctorMonthlyPayout:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const getAdminWalletOverview = async (req, res) => {
  try {
    const adminAuthId = req.user?._id;
    const [walletTransactions, payments, payouts, doctors] = await Promise.all([
      AdminWalletTransaction.find({}).sort({ createdAt: -1 }).limit(200),
      Payment.find({ verificationStatus: "verified" }).sort({ createdAt: -1 }).limit(200),
      DoctorMonthlyPayout.find({}).sort({ createdAt: -1 }).limit(200),
      Doctor.find({}).sort({ createdAt: -1 }).limit(200),
    ]);

    const walletBalance = computeAdminWalletBalance(walletTransactions);
    const totalCollections = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          adminAuthId,
          walletBalance,
          totalCollections,
          pendingDoctors: doctors.filter((doctor) => !doctor.isApproved).length,
          walletTransactions,
          payments,
          payouts,
        },
        "Admin wallet overview fetched",
      ),
    );
  } catch (error) {
    console.error("Error in getAdminWalletOverview:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
