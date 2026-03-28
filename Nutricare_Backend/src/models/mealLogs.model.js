import mongoose from "mongoose";
const FoodSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String
}, { _id: false });

const NutritionSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 }
}, { _id: false });

const MealLogSchema = new mongoose.Schema({

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

  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack", "snacks"],
    required: true,
    index: true
  },

  foods: [FoodSchema],

  // 🔥 nutrition for THIS meal entry
  nutrition: NutritionSchema,

  // optional tracking
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

MealLogSchema.index({ authId: 1, date: 1, mealType: 1 }, { unique: true });

export default mongoose.model("MealLog", MealLogSchema);
