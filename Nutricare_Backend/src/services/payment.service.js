import crypto from "node:crypto";
import razorpay, {
  hasRazorpayCredentials,
  razorpayKeyId,
  razorpayKeySecret,
} from "../config/razorpay.js";
import { ApiError } from "../utils/ApiError.js";

export const assertRazorpayReady = () => {
  if (!hasRazorpayCredentials || !razorpay) {
    throw new ApiError(
      500,
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_SECRET in backend .env.",
    );
  }
};

export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  assertRazorpayReady();

  return razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt,
    notes,
  });
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  assertRazorpayReady();

  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
};

export const getRazorpayCheckoutConfig = () => ({
  keyId: razorpayKeyId,
});
