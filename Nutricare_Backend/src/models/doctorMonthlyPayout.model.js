import mongoose from "mongoose";

const doctorMonthlyPayoutSchema = new mongoose.Schema(
  {
    doctorAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    monthKey: {
      type: String, // YYYY-MM
      required: true,
      index: true,
    },
    patientCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    feePerPatient: {
      type: Number,
      required: true,
      default: 250,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
    },
    paidByAdminAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  { timestamps: true },
);

doctorMonthlyPayoutSchema.index({ doctorAuthId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model("DoctorMonthlyPayout", doctorMonthlyPayoutSchema);

