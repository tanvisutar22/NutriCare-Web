import mongoose from "mongoose";
const ActivityLogSchema = new mongoose.Schema({

  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    index: true
  },

  activityType: {
    type: String,
    required: true
  },

  duration: {
    type: Number, // in minutes
    required: true
  },

  caloriesBurned: {
    type: Number,
    default: 0
  },

  // optional intensity (future use)
  intensity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  source: {
    type: String,
    enum: ["ai", "manual"],
    default: "ai"
  },

  fallback: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

export default mongoose.model("ActivityLog", ActivityLogSchema);