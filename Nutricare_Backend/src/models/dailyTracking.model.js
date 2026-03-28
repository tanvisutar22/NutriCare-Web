import mongoose from "mongoose";

const dailyTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    steps: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterIntake: {
      type: Number,
      default: 0,
      min: 0,
    },
    mood: {
      type: String,
      enum: ["happy", "stressed", "emotional eating"],
      default: "happy",
    },
    isTracked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

dailyTrackingSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyTracking", dailyTrackingSchema);
