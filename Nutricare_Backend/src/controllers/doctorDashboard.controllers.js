import ActivityLog from "../models/activityLog.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import DoctorReviewRequest from "../models/doctorReviewRequest.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import DietPlan from "../models/diet.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import MealLog from "../models/mealLogs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDoctorDashboardSummary = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;

    const [totalPatients, totalNotes, pendingRequests, recentPatients] = await Promise.all([
      DoctorPatient.countDocuments({ doctorAuthId, status: "active" }),
      DoctorNote.countDocuments({ doctorAuthId }),
      DoctorReviewRequest.countDocuments({ doctorAuthId, status: "pending" }),
      DoctorPatient.find({ doctorAuthId, status: "active" })
        .populate("patientAuthId", "email userType")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalPatients,
          totalNotes,
          pendingRequests,
          recentPatients,
        },
        "Doctor dashboard summary fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getPatientFullDetails = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.params;

    const mapping = await DoctorPatient.findOne({
      doctorAuthId,
      patientAuthId,
      status: "active",
    });

    if (!mapping) {
      return res
        .status(403)
        .json(new ApiError(403, "Patient is not assigned to this doctor"));
    }

    const [patientProfile, metrics, diets, notes, mealLogs, activityLogs, reviewRequests] =
      await Promise.all([
        User.findOne({ authId: patientAuthId }),
        BodyMetrics.find({ authId: patientAuthId }).sort({ recordedAt: -1 }),
        DietPlan.find({ authId: patientAuthId }).sort({ startDate: -1, createdAt: -1 }),
        DoctorNote.find({ patientAuthId }).sort({ createdAt: -1 }),
        MealLog.find({ authId: patientAuthId }).sort({ date: -1, createdAt: -1 }).limit(20),
        ActivityLog.find({ userId: patientAuthId }).sort({ date: -1, createdAt: -1 }).limit(20),
        DoctorReviewRequest.find({ patientAuthId }).sort({ createdAt: -1 }).limit(20),
      ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          patientProfile,
          metrics,
          diets,
          notes,
          mealLogs,
          activityLogs,
          reviewRequests,
        },
        "Patient full details fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getDoctorWallet = async (req, res) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const txs = await DoctorWalletTransaction.find({ doctorAuthId })
      .sort({ createdAt: -1 })
      .limit(200);

    const balance = txs.reduce((acc, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === "credit_payout") return acc + amount;
      if (transaction.type === "debit_withdrawal") return acc - amount;
      return acc;
    }, 0);

    return res.status(200).json(
      new ApiResponse(
        200,
        { balance, transactions: txs },
        "Wallet fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getDoctorWallet:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
