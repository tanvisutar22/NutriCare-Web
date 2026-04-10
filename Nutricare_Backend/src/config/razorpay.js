import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret =
  process.env.RAZORPAY_SECRET?.trim() || process.env.RAZORPAY_SECRETE?.trim();

export const hasRazorpayCredentials = Boolean(keyId && keySecret);

const razorpay = hasRazorpayCredentials
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

export { keyId as razorpayKeyId, keySecret as razorpayKeySecret };
export default razorpay;
