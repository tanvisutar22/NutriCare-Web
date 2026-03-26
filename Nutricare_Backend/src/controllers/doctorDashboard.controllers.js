import DoctorPatient from "../models/doctorPatient.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import DietPlan from "../models/diet.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getDoctorDashboardSummary = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;

    const totalPatients = await DoctorPatient.countDocuments({
      doctorAuthId,
      status: "active",
    });

    const totalNotes = await DoctorNote.countDocuments({
      doctorAuthId,
    });

    const recentPatients = await DoctorPatient.find({
      doctorAuthId,
      status: "active",
    })
      .populate("patientAuthId", "email userType")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalPatients,
          totalNotes,
          recentPatients,
        },
        "Doctor dashboard summary fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getPatientFullDetails = async (req, res) => {
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

    const patientProfile = await User.findOne({ authId: patientAuthId });

    const metrics = await BodyMetrics.find({
      authId: patientAuthId,
    }).sort({ recordedAt: -1 });

    const diets = await DietPlan.find({
      authId: patientAuthId,
    }).sort({ startDate: -1, createdAt: -1 });

    const notes = await DoctorNote.find({
      doctorAuthId,
      patientAuthId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          patientProfile,
          metrics,
          diets,
          notes,
        },
        "Patient full details fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export { getDoctorDashboardSummary, getPatientFullDetails };

export const getDoctorWallet = async (req, res) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const txs = await DoctorWalletTransaction.find({ doctorAuthId })
      .sort({ createdAt: -1 })
      .limit(200);

    const balance = txs.reduce((acc, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "credit_payout") return acc + amt;
      if (t.type === "debit_withdrawal") return acc - amt;
      return acc;
    }, 0);

    return res
      .status(200)
      .json(new ApiResponse(200, { balance, transactions: txs }, "Wallet fetched"));
  } catch (error) {
    console.error("Error in getDoctorWallet:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
