import mongoose from "mongoose";
const WeeklyScoreSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
    index: true
  },

  dietPlanId: String,

  startDate: Date,
  endDate: Date,

  isActive: {
    type: Boolean,
    default: true
  },

  // 📊 averages
  avgCalorieScore: Number,
  avgProteinScore: Number,
  avgActivityScore: Number,
  finalScore: Number,

  // 🔥 Consistency tracking
  daysTracked: {
    type: Number,
    default: 0
  },

  streakDays: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const weeklyScoreSchema = mongoose.model("WeeklyScore", WeeklyScoreSchema); 
export default weeklyScoreSchema;