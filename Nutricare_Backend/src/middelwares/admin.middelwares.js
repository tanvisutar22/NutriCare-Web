export const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.userType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

