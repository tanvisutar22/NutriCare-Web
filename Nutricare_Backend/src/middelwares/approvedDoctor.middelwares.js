import Doctor from "../models/doctor.model.js";

export const verifyApprovedDoctor = async (req, res, next) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const doctorProfile = await Doctor.findOne({ authId: doctorAuthId });
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        code: "PROFILE_INCOMPLETE",
        message: "Doctor profile not found",
      });
    }

    if (!doctorProfile.profileComplete) {
      return res.status(403).json({
        success: false,
        code: "PROFILE_INCOMPLETE",
        message: "Doctor profile is incomplete",
      });
    }

    if (!doctorProfile.isApproved || doctorProfile.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        code: "APPROVAL_PENDING",
        message: "Doctor not approved by admin",
      });
    }

    req.doctorProfile = doctorProfile;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

