import mongoose from "mongoose";

const doctorReviewRequestSchema = new mongoose.Schema(
  {
    doctorAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    patientAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    dietPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DietPlan",
    },
    snapshot: {
      weight: { type: Number },
      bmi: { type: Number },
      bmr: { type: Number },
      tdee: { type: Number },
    },
    status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
      index: true,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

doctorReviewRequestSchema.index({
  doctorAuthId: 1,
  patientAuthId: 1,
  status: 1,
  createdAt: -1,
});

export default mongoose.model("DoctorReviewRequest", doctorReviewRequestSchema);

