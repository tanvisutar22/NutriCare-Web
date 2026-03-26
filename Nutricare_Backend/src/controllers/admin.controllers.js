import Doctor from "../models/doctor.model.js";
import DoctorMonthlyPayout from "../models/doctorMonthlyPayout.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const parseMonthKey = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const [y, m] = monthKey.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return { year: y, month: m };
};

const monthRange = ({ year, month }) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const listDoctorsForAdmin = async (req, res) => {
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
      { isApproved },
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

    const approvedDoctors = await Doctor.find({ isApproved: true }).select(
      "authId name specialization",
    );

    const results = [];

    for (const d of approvedDoctors) {
      const doctorAuthId = d.authId;
      if (!doctorAuthId) continue;

      // distinct patients with >=1 note in this month
      const patientIds = await DoctorNote.distinct("patientAuthId", {
        doctorAuthId,
        createdAt: { $gte: start, $lte: end },
      });

      const patientCount = patientIds.length;
      const feePerPatient = 250;
      const totalAmount = patientCount * feePerPatient;

      const payout = await DoctorMonthlyPayout.findOneAndUpdate(
        { doctorAuthId, monthKey },
        {
          $setOnInsert: {
            status: "pending",
          },
          $set: {
            patientCount,
            feePerPatient,
            totalAmount,
          },
        },
        { new: true, upsert: true },
      );

      results.push({
        doctorAuthId,
        doctor: d,
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
    const { monthKey } = req.body || {};

    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
      return res
        .status(400)
        .json(new ApiError(400, "monthKey must be YYYY-MM"));
    }

    const payout = await DoctorMonthlyPayout.findOne({
      doctorAuthId,
      monthKey,
    });

    if (!payout) {
      return res.status(404).json(new ApiError(404, "Payout not found"));
    }

    if (payout.status === "paid") {
      return res.status(400).json(new ApiError(400, "Payout already paid"));
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    payout.paidByAdminAuthId = adminAuthId;
    await payout.save();

    const tx = await DoctorWalletTransaction.create({
      doctorAuthId,
      type: "credit_payout",
      amount: payout.totalAmount,
      referenceType: "DoctorMonthlyPayout",
      referenceId: payout._id,
      meta: { monthKey },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { payout, transaction: tx }, "Payout paid"));
  } catch (error) {
    console.error("Error in payDoctorMonthlyPayout:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

