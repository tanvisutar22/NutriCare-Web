import Doctor from "../models/doctor.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createDoctorProfile = async (req, res) => {
  try {
    const authId = req.user._id;

    const existing = await Doctor.findOne({ authId });
    if (existing)
      return res.status(400).json(new ApiError(400, "Profile already exists"));

    const { name, specialization, experience, hospital } = req.body;

    const doctor = await Doctor.create({
      authId,
      name,
      specialization,
      experience,
      hospital,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, doctor, "Doctor profile created"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ authId: req.user._id });

    return res.status(200).json(new ApiResponse(200, doctor));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
