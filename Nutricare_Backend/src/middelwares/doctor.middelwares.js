export const verifyDoctor = (req, res, next) => {
  try {
    if (!req.user || req.user.userType !== "Docter") {
      return res.status(403).json({
        success: false,
        message: "Doctor access only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
