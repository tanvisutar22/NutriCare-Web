import DoctorReviewRequest from "../models/doctorReviewRequest.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import Doctor from "../models/doctor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const listMyReviewRequests = async (req, res) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const doctorProfile = await Doctor.findOne({ authId: doctorAuthId });
    if (!doctorProfile?.isApproved) {
      return res
        .status(403)
        .json(new ApiError(403, "Doctor is not approved by admin"));
    }

    const { status } = req.query || {};
    const filter = { doctorAuthId };
    if (status && ["pending", "reviewed"].includes(status)) {
      filter.status = status;
    }

    const requests = await DoctorReviewRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    return res
      .status(200)
      .json(new ApiResponse(200, requests, "Review requests fetched"));
  } catch (error) {
    console.error("Error in listMyReviewRequests:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const commitReviewRequest = async (req, res) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const doctorProfile = await Doctor.findOne({ authId: doctorAuthId });
    if (!doctorProfile?.isApproved) {
      return res
        .status(403)
        .json(new ApiError(403, "Doctor is not approved by admin"));
    }

    const { requestId } = req.params;
    const { title, note, recommendation } = req.body || {};

    if (!title || !note) {
      return res
        .status(400)
        .json(new ApiError(400, "title and note are required"));
    }

    const request = await DoctorReviewRequest.findOne({
      _id: requestId,
      doctorAuthId,
    });

    if (!request) {
      return res.status(404).json(new ApiError(404, "Request not found"));
    }

    if (request.status === "reviewed") {
      return res
        .status(400)
        .json(new ApiError(400, "Request already reviewed"));
    }

    // Ensure doctor-patient mapping exists
    await DoctorPatient.findOneAndUpdate(
      { doctorAuthId, patientAuthId: request.patientAuthId },
      { $set: { status: "active" } },
      { upsert: true, new: true },
    );

    const doctorNote = await DoctorNote.create({
      doctorAuthId,
      patientAuthId: request.patientAuthId,
      title,
      note,
      recommendation: recommendation || "",
    });

    request.status = "reviewed";
    request.reviewedAt = new Date();
    await request.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { request, doctorNote },
          "Review committed successfully",
        ),
      );
  } catch (error) {
    console.error("Error in commitReviewRequest:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

