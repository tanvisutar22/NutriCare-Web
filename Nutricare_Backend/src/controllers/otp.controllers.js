import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Otp } from "../models/otp.model.js";
import Email from "../utils/Email.js";
async function sendOtp(req, res) {
  try {
    const email = req?.body?.email;
    if (!email)
      return res.status(400).json(new ApiError(400, "Email not present"));

    let Createdotp = Math.floor(100000 + Math.random() * 900000);
    Email(email, "OTP for account verification", `Your OTP is ${Createdotp}`);
    const otpCreated = await Otp.create({ email, otp: Createdotp });
    if (!otpCreated)
      return res.status(500).json(new ApiError(500, "Failed to create OTP"));
    return res
      .status(200)
      .json(new ApiResponse(200, { email }, "OTP sent successfully"));
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json(new ApiError(500, "internal server error"));
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp, email } = req?.body || {};
    console.log("Received OTP verification request for email:", email); // Debug log
    console.log("OTP received:", otp); // Debug log
    if (!otp) return res.status(400).json(new ApiError(400, "otp not present"));
    if (!email)
      return res.status(400).json(new ApiError(400, "email not found"));
    const existedOtp = await Otp.findOne({ email });
    if (!existedOtp)
      return res
        .status(500)
        .json(new ApiError(500, "something went wrong! Try again."));
    if (existedOtp.otp != otp)
      return res.status(400).json(new ApiError(400, "otp dosen't match"));
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP verified successfully"));
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json(new ApiError(500, "internal server error"));
  }
}

export { sendOtp, verifyOtp };
