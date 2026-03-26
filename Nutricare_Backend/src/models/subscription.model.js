import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    patientAuthId: {
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
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  { timestamps: true },
);

subscriptionSchema.index({ patientAuthId: 1, status: 1, endDate: -1 });

export default mongoose.model("Subscription", subscriptionSchema);

