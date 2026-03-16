import mongoose from "mongoose";
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 120 * 1000), // Expire after 120 seconds
      index: { expires: 120 }, // TTL Index
    },
  },
  { timestamps: true },
);

// Create OTP Model
export const Otp = mongoose.model("Otp", otpSchema);
