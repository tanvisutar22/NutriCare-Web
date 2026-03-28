import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    payerAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    provider: {
      type: String,
      enum: ["mock"],
      default: "mock",
    },
    status: {
      type: String,
      enum: ["paid", "pending", "failed", "verified"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "mock"],
      default: "mock",
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    validityStart: {
      type: Date,
    },
    validityEnd: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

paymentSchema.index({ payerAuthId: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);

