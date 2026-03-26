import DoctorNote from "../models/doctorNote.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createDoctorNote = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId, title, note, recommendation } = req.body;

    if (!patientAuthId || !title || !note) {
      return res
        .status(400)
        .json(new ApiError(400, "patientAuthId, title and note are required"));
    }

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

    const doctorNote = await DoctorNote.create({
      doctorAuthId,
      patientAuthId,
      title,
      note,
      recommendation,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, doctorNote, "Doctor note created successfully"),
      );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getDoctorPatientNotes = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.params;

    const notes = await DoctorNote.find({
      doctorAuthId,
      patientAuthId,
    }).sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, notes, "Doctor notes fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export { createDoctorNote, getDoctorPatientNotes };
