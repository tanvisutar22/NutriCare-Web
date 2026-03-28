import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Doctor from "../models/doctor.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import {
  getDoctorSelectionForPatient,
  getDoctorSelectionsForPatients,
} from "../utils/doctorSelection.js";

export const createUserProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const {
      name,
      gender,
      age,
      height,
      foodPreference,
      medicalConditions,
      allergies,
      goal,
    } = req.body || {};

    if (!name || !gender || !age || !height) {
      return res
        .status(400)
        .json(new ApiError(400, "name, gender, age and height are required"));
    }

    const payload = {
      authId,
      name,
      gender,
      age,
      height,
      foodPreference,
      medicalConditions,
      allergies,
      goal,
    };

    const profile = await User.findOneAndUpdate({ authId }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile saved successfully"));
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while saving profile"));
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const profile = await User.findOne({ authId });
    if (!profile) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile fetched successfully"));
  } catch (error) {
    console.error("Error in getMyProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching profile"));
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const updates = req.body || {};
    const profile = await User.findOneAndUpdate({ authId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!profile) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User profile updated successfully"));
  } catch (error) {
    console.error("Error in updateMyProfile:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while updating profile"));
  }
};

export const getMyDoctorNotes = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const notes = await DoctorNote.find({ patientAuthId: authId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("doctorAuthId", "email userType");

    return res
      .status(200)
      .json(new ApiResponse(200, notes, "Doctor notes fetched successfully"));
  } catch (error) {
    console.error("Error in getMyDoctorNotes:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const listApprovedDoctorsForUsers = async (_req, res) => {
  try {
    const doctors = await Doctor.find({
      isApproved: true,
      approvalStatus: "approved",
      profileComplete: true,
    }).sort({ createdAt: -1 });

    const activeMappings = await DoctorPatient.find({ status: "active" });
    const selections = await getDoctorSelectionsForPatients(
      activeMappings.map((mapping) => mapping.patientAuthId),
    );

    const doctorsWithCapacity = await Promise.all(
      doctors.map(async (doctor) => {
        const activePatients = activeMappings.filter(
          (mapping) =>
            String(mapping.doctorAuthId) === String(doctor.authId) &&
            selections.get(String(mapping.patientAuthId))?.doctorAuthId === String(doctor.authId),
        ).length;

        return {
          ...doctor.toObject(),
          activePatients,
          isAvailable: activePatients < (doctor.patientCapacity || 3),
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, doctorsWithCapacity, "Approved doctors fetched"));
  } catch (error) {
    console.error("Error in listApprovedDoctorsForUsers:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const getMyAssignedDoctor = async (req, res) => {
  try {
    const patientAuthId = req.user?._id;
    const [selection, assignment] = await Promise.all([
      getDoctorSelectionForPatient(patientAuthId),
      DoctorPatient.findOne({
        patientAuthId,
        status: "active",
      }),
    ]);

    if (!selection?.doctorAuthId) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "No doctor assigned yet"));
    }

    const selectedDoctorAuthId = selection.doctorAuthId;
    const doctor = await Doctor.findOne({ authId: selectedDoctorAuthId });

    if (!doctor) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "No doctor assigned yet"));
    }

    const activeAssignment =
      assignment && String(assignment.doctorAuthId) === String(selectedDoctorAuthId)
        ? assignment
        : await DoctorPatient.findOne({
            patientAuthId,
            doctorAuthId: selectedDoctorAuthId,
            status: "active",
          });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          assignment: activeAssignment,
          doctor,
          paymentSelection: selection,
        },
        "Assigned doctor fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getMyAssignedDoctor:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const bookDoctorForUser = async (req, res) => {
  try {
    const patientAuthId = req.user?._id;
    const { doctorAuthId } = req.body || {};

    if (!doctorAuthId) {
      return res.status(400).json(new ApiError(400, "doctorAuthId is required"));
    }

    const [existingAssignment, activeSubscription, doctor, currentSelection] = await Promise.all([
      DoctorPatient.findOne({ patientAuthId, status: "active" }),
      Subscription.findOne({
        patientAuthId,
        status: "active",
        endDate: { $gte: new Date() },
      }).sort({ endDate: -1 }),
      Doctor.findOne({
        authId: doctorAuthId,
        isApproved: true,
        approvalStatus: "approved",
        profileComplete: true,
      }),
      getDoctorSelectionForPatient(patientAuthId),
    ]);

    if (
      currentSelection?.doctorAuthId &&
      String(currentSelection.doctorAuthId) === String(doctorAuthId)
    ) {
      return res
        .status(200)
        .json(new ApiResponse(200, { assignment: existingAssignment, doctor }, "Doctor already selected"));
    }

    if (currentSelection?.doctorAuthId && String(currentSelection.doctorAuthId) !== String(doctorAuthId)) {
      return res
        .status(409)
        .json(new ApiError(409, "User is already assigned to another doctor"));
    }

    if (!activeSubscription) {
      return res
        .status(400)
        .json(new ApiError(400, "No active subscription found"));
    }

    if (!doctor) {
      return res
        .status(404)
        .json(new ApiError(404, "Selected doctor is not available"));
    }

    const activeMappings = await DoctorPatient.find({
      doctorAuthId,
      status: "active",
    });
    const selections = await getDoctorSelectionsForPatients(
      activeMappings.map((mapping) => mapping.patientAuthId),
    );
    const activePatients = activeMappings.filter(
      (mapping) => selections.get(String(mapping.patientAuthId))?.doctorAuthId === String(doctorAuthId),
    ).length;

    if (activePatients >= (doctor.patientCapacity || 3)) {
      return res
        .status(400)
        .json(new ApiError(400, "This doctor is currently unavailable"));
    }

    let assignment;
    if (existingAssignment) {
      existingAssignment.doctorAuthId = doctorAuthId;
      existingAssignment.status = "active";
      assignment = await existingAssignment.save();
    } else {
      assignment = await DoctorPatient.create({
        doctorAuthId,
        patientAuthId,
        status: "active",
      });
    }

    const latestPayment = await Payment.findOne({
      payerAuthId: patientAuthId,
      verificationStatus: "verified",
    }).sort({ createdAt: -1 });

    if (latestPayment) {
      latestPayment.meta = {
        ...(latestPayment.meta || {}),
        selectedDoctorAuthId: doctorAuthId,
        doctorAssignedAt: new Date().toISOString(),
      };
      await latestPayment.save();
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          assignment,
          doctor,
        },
        "Doctor booked successfully",
      ),
    );
  } catch (error) {
    console.error("Error in bookDoctorForUser:", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json(new ApiError(409, "User is already assigned to another doctor"));
    }
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
