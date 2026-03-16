import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import DietPlan from "../models/diet.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import { buildMealsFromFoodCsv } from "../utils/foodSelector.js";

const getLatestMetric = async (authId, metricType) => {
  return BodyMetrics.findOne({ authId, metricType }).sort({ recordedAt: -1 });
};

const resolveTdee = async (authId) => {
  const latestTdee = await getLatestMetric(authId, "tdee");
  if (latestTdee?.value) return Number(latestTdee.value);

  const latestBmr = await getLatestMetric(authId, "bmr");
  const latestActivity = await getLatestMetric(authId, "activityLevel");
  if (!latestBmr || !latestActivity) return null;

  const activityFactor =
    typeof latestActivity.value === "number" ? latestActivity.value : 1.375;

  return Math.round(Number(latestBmr.value) * activityFactor);
};

const getMacroTargetsFromTdee = (tdee, weightKg) => {
  // Simple professional defaults: 1.8g protein/kg, 25% fat, rest carbs
  const proteinPerKg = 1.8;
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCals = proteinGrams * 4;

  const fatCals = Math.round(tdee * 0.25);
  const fatGrams = Math.round(fatCals / 9);

  const remainingCals = tdee - proteinCals - fatCals;
  const carbGrams = Math.max(0, Math.round(remainingCals / 4));

  return {
    calorieTarget: tdee,
    proteinTarget: proteinGrams,
    fatTarget: fatGrams,
    carbTarget: carbGrams,
  };
};

export const createDietPlan = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { startDate, endDate } = req.body || {};

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(new ApiError(400, "startDate and endDate are required"));
    }

    const user = await User.findOne({ authId });
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found for diet plan"));
    }

    const latestWeight = await getLatestMetric(authId, "weight");
    if (!latestWeight) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Weight metric not found; add body metrics before creating diet plan",
          ),
        );
    }

    const weightKg = Number(latestWeight.value);

    const tdee = await resolveTdee(authId);
    if (!tdee) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Unable to resolve TDEE; ensure BMR/TDEE metrics exist",
          ),
        );
    }

    const targets = getMacroTargetsFromTdee(tdee, weightKg);

    const built = await buildMealsFromFoodCsv(user, targets, {
      breakfast: 5,
      lunch: 7,
      dinner: 7,
    });
    if (!built) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "No suitable foods found in food.csv for this user",
          ),
        );
    }

    const { meals, mealGoals, mealOptions } = built;

    const plan = await DietPlan.create({
      userId: user._id,
      authId,
      startDate,
      endDate,
      calorieTarget: targets.calorieTarget,
      proteinTarget: targets.proteinTarget,
      carbTarget: targets.carbTarget,
      fatTarget: targets.fatTarget,
      meals,
      mealGoals,
      mealOptions,
      createdBy: "ai",
      status: "active",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, plan, "Diet plan created successfully"));
  } catch (error) {
    console.error("Error in createDietPlan:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while creating diet"));
  }
};

export const listDietPlans = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const plans = await DietPlan.find({ authId }).sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, plans, "Diet plans fetched successfully"));
  } catch (error) {
    console.error("Error in listDietPlans:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching diets"));
  }
};

export const getDietPlanById = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { id } = req.params;

    const plan = await DietPlan.findOne({ _id: id, authId });
    if (!plan) {
      return res
        .status(404)
        .json(new ApiError(404, "Diet plan not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, plan, "Diet plan fetched successfully"));
  } catch (error) {
    console.error("Error in getDietPlanById:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching diet"));
  }
};

export const updateDietPlanStatus = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { id } = req.params;
    const { status } = req.body || {};

    if (!["active", "completed"].includes(status)) {
      return res
        .status(400)
        .json(new ApiError(400, "status must be 'active' or 'completed'"));
    }

    const plan = await DietPlan.findOneAndUpdate(
      { _id: id, authId },
      { status },
      { new: true },
    );

    if (!plan) {
      return res
        .status(404)
        .json(new ApiError(404, "Diet plan not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, plan, "Diet plan updated successfully"));
  } catch (error) {
    console.error("Error in updateDietPlanStatus:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while updating diet"));
  }
};

