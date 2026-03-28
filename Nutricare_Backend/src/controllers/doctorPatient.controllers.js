import DoctorPatient from "../models/doctorPatient.model.js";
import Doctor from "../models/doctor.model.js";
import { auth as Auth } from "../models/auth.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const assignPatientToDoctor = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.body || {};

    if (!patientAuthId) {
      return res
        .status(400)
        .json(new ApiError(400, "patientAuthId is required"));
    }

    const [patient, doctorProfile] = await Promise.all([
      Auth.findById(patientAuthId),
      Doctor.findOne({ authId: doctorAuthId }),
    ]);

    if (!patient) {
      return res.status(404).json(new ApiError(404, "Patient not found"));
    }

    if (patient.userType !== "User") {
      return res
        .status(400)
        .json(new ApiError(400, "Selected account is not a patient"));
    }

    if (!doctorProfile?.isApproved) {
      return res
        .status(403)
        .json(new ApiError(403, "Doctor is not approved for assignments"));
    }

    const existingAssignment = await DoctorPatient.findOne({
      patientAuthId,
      status: "active",
    });

    if (existingAssignment && String(existingAssignment.doctorAuthId) !== String(doctorAuthId)) {
      return res
        .status(409)
        .json(new ApiError(409, "Patient is already assigned to another doctor"));
    }

    if (existingAssignment) {
      return res
        .status(200)
        .json(new ApiResponse(200, existingAssignment, "Patient already assigned"));
    }

    const mapping = await DoctorPatient.create({
      doctorAuthId,
      patientAuthId,
      status: "active",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, mapping, "Patient assigned successfully"));
  } catch (error) {
    console.error("Error in assignPatientToDoctor:", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json(new ApiError(409, "Patient is already assigned to another doctor"));
    }
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAssignedPatients = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;

    const mappings = await DoctorPatient.find({
      doctorAuthId,
      status: "active",
    }).populate("patientAuthId", "email userType");

    return res
      .status(200)
      .json(new ApiResponse(200, mappings, "Assigned patients fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const removeAssignedPatient = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.params;

    const mapping = await DoctorPatient.findOneAndUpdate(
      {
        doctorAuthId,
        patientAuthId,
        status: "active",
      },
      {
        status: "removed",
      },
      { new: true },
    );

    if (!mapping) {
      return res
        .status(404)
        .json(new ApiError(404, "Assigned patient not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, mapping, "Patient removed successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
