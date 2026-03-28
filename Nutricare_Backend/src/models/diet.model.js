import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  protein: {
    type: Number,
    required: true
  },
  carbs: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    required: true
  }
});

const dietSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },
  Day:{
    type:String,
    required:true
  },
  calorieTarget: Number,
  proteinTarget: Number,
  carbTarget: Number,
  fatTarget: Number,

  meals: {
    breakfast: [foodSchema],
    lunch: [foodSchema],
    dinner: [foodSchema]
  },

  mealGoals: {
    breakfast: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    },
    lunch: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    },
    dinner: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  },

  mealOptions: {
    breakfast: [{ foods: [foodSchema], totals: { calories: Number, protein: Number, carbs: Number, fat: Number } }],
    lunch: [{ foods: [foodSchema], totals: { calories: Number, protein: Number, carbs: Number, fat: Number } }],
    dinner: [{ foods: [foodSchema], totals: { calories: Number, protein: Number, carbs: Number, fat: Number } }]
  },

  createdBy: {
    type: String,
    enum: ["ai", "doctor"],
    default: "ai"
  },

  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  },

  isFollowed: {
    type: Boolean,
    default: false
  },

  followedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

export default mongoose.model("DietPlan", dietSchema);
