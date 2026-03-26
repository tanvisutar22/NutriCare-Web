import mongoose from "mongoose";
const DailyScoreSchema = new mongoose.Schema({

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

  dietPlanId: String,

  // 🎯 Targets
  targetCalories: Number,
  targetProtein: Number,

  // 📊 Actual
  actualCalories: Number,
  actualProtein: Number,
  caloriesBurned: Number,

  // 📈 Scores
  calorieScore: Number,
  proteinScore: Number,
  activityScore: Number,
  finalScore: Number,

  // 🔥 Consistency
  isTracked: {
    type: Boolean,
    default: false // true if user logged anything that day
  }

}, { timestamps: true });

DailyScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

const dailyScoreSchema = mongoose.model("DailyScore", DailyScoreSchema);

export default dailyScoreSchema;