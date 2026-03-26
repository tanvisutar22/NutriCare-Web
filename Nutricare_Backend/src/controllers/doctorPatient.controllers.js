import DoctorPatient from "../models/doctorPatient.model.js";
import { auth as Auth } from "../models/auth.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const assignPatientToDoctor = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.body;

    if (!patientAuthId) {
      return res
        .status(400)
        .json(new ApiError(400, "patientAuthId is required"));
    }

    const patient = await Auth.findById(patientAuthId);

    if (!patient) {
      return res.status(404).json(new ApiError(404, "Patient not found"));
    }

    if (patient.userType !== "User") {
      return res
        .status(400)
        .json(new ApiError(400, "Selected account is not a patient"));
    }

    const existingMapping = await DoctorPatient.findOne({
      doctorAuthId,
      patientAuthId,
      status: "active",
    });

    if (existingMapping) {
      return res
        .status(400)
        .json(new ApiError(400, "Patient already assigned"));
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
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getAssignedPatients = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;

    const mappings = await DoctorPatient.find({
      doctorAuthId,
      status: "active",
    }).populate("patientAuthId", "email userType");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mappings,
          "Assigned patients fetched successfully",
        ),
      );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const removeAssignedPatient = async (req, res) => {
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

export { assignPatientToDoctor, getAssignedPatients, removeAssignedPatient };
