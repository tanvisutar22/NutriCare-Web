import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import DietPlan from "../models/diet.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import { buildMealsFromFoodCsv } from "../utils/foodSelector.js";
import manageWeeklyCycle from "../utils/weekly Score/manageWeeklyCycle.js";

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

    const { startDate } = req.body || {};

    if (!startDate) {
      return res
        .status(400)
        .json(new ApiError(400, "startDate is required"));
    }

    const user = await User.findOne({ authId });
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, "User profile not found"));
    }

    const latestWeight = await getLatestMetric(authId, "weight");
    if (!latestWeight) {
      return res.status(400).json(
        new ApiError(
          400,
          "Weight metric not found; add body metrics first"
        )
      );
    }

    const weightKg = Number(latestWeight.value);

    const tdee = await resolveTdee(authId);
    if (!tdee) {
      return res.status(400).json(
        new ApiError(
          400,
          "Unable to resolve TDEE; ensure metrics exist"
        )
      );
    }

    const targets = getMacroTargetsFromTdee(tdee, weightKg);

    // ✅ Start date
    const start = new Date(startDate);
    const endDate = new Date(startDate); // 7 days total
    if (isNaN(start.getTime())) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid startDate format"));
    }
    endDate.setDate(start.getDate() + 6); // 7-day plan
    endDate.setHours(0, 0, 0, 0);
    console.log(endDate);
    const plans = [];

    // 🔥 7-day loop
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      // ✅ normalize date (IMPORTANT)
      currentDate.setHours(0, 0, 0, 0);

      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // ✅ Generate meals (random each time)
      const built = await buildMealsFromFoodCsv(user, targets);
      if (!built) continue;

      const { meals, mealGoals } = built;

      // 🔥 UPSERT (update or create)
      const plan = await DietPlan.findOneAndUpdate(
        {
          authId,
          startDate: currentDate,
        },
        {
          $set: {
            userId: user._id,
            Day: dayName,
            calorieTarget: targets.calorieTarget,
            proteinTarget: targets.proteinTarget,
            carbTarget: targets.carbTarget,
            fatTarget: targets.fatTarget,
            meals,
            mealGoals,
            endDate,
            createdBy: "ai",
            status: "active",
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      plans.push(plan);
    }
    const result=await manageWeeklyCycle(user._id, plans[0]._id);
    // console.log("Weekly cycle managed:", result);
    return res.status(201).json(
      new ApiResponse(201, plans, "7-day diet plan created/updated successfully")
    );

  } catch (error) {
    console.error("Error in createDietPlan:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error"));
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
    console.log("getDietPlanById called with authId:", authId);
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
//send only active diet plan for the day in dashboard
export const getTodayDietPlan = async (req, res) => {
  try {
    console.log("getTodayDietPlan called");
    const authId = req.user?._id;
    console.log("Auth ID:", authId);
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    } 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plan = await DietPlan.find
    ({
      authId,
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    if (!plan || plan.length === 0) {
      return res
        .status(404)
        .json(new ApiError(404, "No active diet plan found for today"));
    }   
    return res
      .status(200)
      .json(new ApiResponse(200, plan[0], "Today's diet plan fetched successfully"));
  } catch (error) {
    console.error("Error in getTodayDietPlan:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching today's diet"));    
  }
}
//get diet plan for the week in dashboard basend on atRT and end date
//steps:-1 get diet plan for today get start date and endate from that plan and then get all diet plan for that week and inacive previos days plan
export const getWeeklyDietPlan = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlan = await DietPlan.findOne({
      authId,
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    if (!todayPlan) {
      return res.status(404).json(new ApiError(404, "No active diet plan found for today"));
    }
    const startDate = todayPlan.startDate;
    const endDate = todayPlan.endDate;
    const weeklyPlans = await DietPlan.find({

      authId,
      startDate: { $gte: startDate, $lte: endDate } 
    }).sort({ startDate: 1 });
    //make previous day plan inactive
    for (let plan of weeklyPlans) {
      if (plan.startDate < today) {
        plan.status = "completed";
        await plan.save();
      }

    if (!weeklyPlans || weeklyPlans.length === 0) {
      return res.status(404).json(new ApiError(404, "No active diet plans found for this week"));
    }
    return res.status(200).json(new ApiResponse(200, weeklyPlans, "Weekly diet plans fetched successfully"));
  }
 }
 catch (error) {   
    console.error("Error in getWeeklyDietPlan:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error while fetching weekly diet plans"));
  }
}
