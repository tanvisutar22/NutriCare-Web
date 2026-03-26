import DoctorPatient from "../models/doctorPatient.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import DietPlan from "../models/diet.model.js";
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
