import mongoose from "mongoose";

const { Schema } = mongoose;

const BodyMetricsSchema = new Schema({
  authId: {
    type: Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
    index: true,
  },
  metricType: {
    type: String,
    enum: ["weight", "activityLevel", "bmi", "bmr", "tdee"],
    required: true,
    index: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const BodyMetrics = mongoose.model("BodyMetrics", BodyMetricsSchema);

export default BodyMetrics;