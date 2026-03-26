import mongoose from "mongoose";

const doctorWalletTransactionSchema = new mongoose.Schema(
  {
    doctorAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit_payout", "debit_withdrawal"],
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

doctorWalletTransactionSchema.index({ doctorAuthId: 1, createdAt: -1 });

export default mongoose.model(
  "DoctorWalletTransaction",
  doctorWalletTransactionSchema,
);

