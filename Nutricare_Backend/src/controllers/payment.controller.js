import Payment from "../models/payment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createRazorpayOrder,
  getRazorpayCheckoutConfig,
  verifyRazorpaySignature,
} from "../services/payment.service.js";

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes, paymentId } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json(new ApiError(400, "Valid amount is required"));
    }

    const order = await createRazorpayOrder({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes,
    });

    if (paymentId) {
      await Payment.findByIdAndUpdate(paymentId, {
        $set: {
          provider: "razorpay",
          status: "created",
          currency: order.currency,
          transactionId: order.id,
          meta: {
            gateway: "razorpay",
            razorpayOrderId: order.id,
            amountInSubunits: order.amount,
            ...notes,
          },
        },
      });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          order,
          ...getRazorpayCheckoutConfig(),
        },
        "Razorpay order created successfully",
      ),
    );
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json(new ApiError(statusCode, error.message || "Unable to create payment order"));
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json(new ApiError(400, "Razorpay verification details are required"));
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json(new ApiError(400, "Invalid Razorpay payment signature"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { verified: true }, "Payment signature verified"));
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json(new ApiError(statusCode, error.message || "Unable to verify payment"));
  }
};
