import Doctor from "../models/doctor.model.js";
import { auth as Auth } from "../models/auth.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const requiredFields = [
  "name",
  "specialization",
  "experience",
  "qualification",
  "phoneNumber",
  "licenseNumber",
];

const buildDoctorPayload = (body = {}) => ({
  name: String(body.name || "").trim(),
  specialization: String(body.specialization || "").trim(),
  experience: Number(body.experience || 0),
  qualification: String(body.qualification || "").trim(),
  phoneNumber: String(body.phoneNumber || "").trim(),
  hospital: String(body.hospital || body.clinicName || "").trim(),
  licenseNumber: String(body.licenseNumber || body.registrationNumber || "").trim(),
  consultationFee: Number(body.consultationFee || 0),
  profilePhoto: String(body.profilePhoto || "").trim(),
  address: String(body.address || "").trim(),
});

const getProfileStatus = (doctor) => ({
  profileComplete: Boolean(doctor?.profileComplete),
  approvalStatus: doctor?.approvalStatus || "pending",
  isApproved: Boolean(doctor?.isApproved),
});

export const createDoctorProfile = async (req, res) => {
  try {
    const authId = req.user._id;
    const payload = buildDoctorPayload(req.body);

    const missingFields = requiredFields.filter((field) => {
      if (field === "experience") {
        return Number.isNaN(payload.experience);
      }
      return !payload[field] && payload[field] !== 0;
    });

    if (missingFields.length) {
      return res.status(400).json(
        new ApiError(
          400,
          `Missing required doctor fields: ${missingFields.join(", ")}`,
        ),
      );
    }

    const authRecord = await Auth.findById(authId).select("email");
    const doctor = await Doctor.findOneAndUpdate(
      { authId },
      {
        $set: {
          ...payload,
          profileComplete: true,
          approvalStatus: "pending",
          isApproved: false,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...doctor.toObject(),
          email: authRecord?.email || req.user?.email || "",
          ...getProfileStatus(doctor),
        },
        "Doctor profile saved successfully",
      ),
    );
  } catch (error) {
    console.error("Error in createDoctorProfile:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ authId: req.user._id });
    const authRecord = await Auth.findById(req.user._id).select("email");

    if (!doctor) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            authId: req.user._id,
            email: authRecord?.email || req.user?.email || "",
            profileComplete: false,
            approvalStatus: "pending",
            isApproved: false,
          },
          "Doctor profile status fetched",
        ),
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...doctor.toObject(),
          email: authRecord?.email || req.user?.email || "",
          ...getProfileStatus(doctor),
        },
        "Doctor profile fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getDoctorProfile:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};
