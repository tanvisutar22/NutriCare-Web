import mongoose from "mongoose";

const adminWalletTransactionSchema = new mongoose.Schema(
  {
    adminAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit_subscription", "debit_doctor_payout"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceType: {
      type: String,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

adminWalletTransactionSchema.index({ createdAt: -1 });

export default mongoose.model(
  "AdminWalletTransaction",
  adminWalletTransactionSchema,
);
