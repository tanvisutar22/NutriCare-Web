import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import DietPlan from "../models/diet.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import { buildMealsFromFoodCsv } from "../utils/foodSelector.js";
import manageWeeklyCycle from "../utils/weekly Score/manageWeeklyCycle.js";
import Subscription from "../models/subscription.model.js";
import DoctorReviewRequest from "../models/doctorReviewRequest.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";

const getLatestMetric = async (authId, metricType) =>
  BodyMetrics.findOne({ authId, metricType }).sort({ recordedAt: -1 });

const planDaysForType = (planType) => (planType === "monthly" ? 30 : 7);

const getLatestNumberMetricValue = async (authId, metricType) => {
  const metric = await getLatestMetric(authId, metricType);
  if (!metric) return null;
  const value = Number(metric.value);
  return Number.isFinite(value) ? value : null;
};

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const getActiveSubscriptionForPlan = async (patientAuthId, planType, start, end) => {
  const now = new Date();
  return Subscription.findOne({
    patientAuthId,
    planType,
    status: "active",
    endDate: { $gte: now },
    startDate: { $lte: end },
    endDate: { $gte: start },
  }).sort({ endDate: -1 });
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
  const proteinGrams = Math.round(weightKg * 1.8);
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

const markPastPlansCompleted = async (authId, todayStart) => {
  await DietPlan.updateMany(
    {
      authId,
      status: "active",
      startDate: { $lt: todayStart },
    },
    {
      $set: { status: "completed" },
    },
  );
};

const calculateDietStreakStats = async (authId) => {
  const plans = await DietPlan.find({ authId, isFollowed: true }).sort({ startDate: 1 });
  const today = startOfDay(new Date());

  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;
  let previous = null;

  for (const plan of plans) {
    const current = startOfDay(plan.startDate);
    if (!previous) {
      running = 1;
    } else {
      const diffDays = Math.round((current - previous) / 86400000);
      running = diffDays === 1 ? running + 1 : 1;
    }

    if (running > longestStreak) longestStreak = running;
    previous = current;
  }

  if (plans.length > 0) {
    let cursor = today;
    const followedKeys = new Set(plans.map((plan) => startOfDay(plan.startDate).toISOString()));
    while (followedKeys.has(cursor.toISOString())) {
      currentStreak += 1;
      cursor = startOfDay(new Date(cursor.getTime() - 86400000));
    }
  }

  const todayPlan = await DietPlan.findOne({
    authId,
    startDate: today,
  });

  return {
    currentStreak,
    longestStreak,
    totalFollowedDays: plans.length,
    todayFollowed: Boolean(todayPlan?.isFollowed),
    todayPlanId: todayPlan?._id || null,
  };
};

export const createDietPlan = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { startDate, planType = "weekly" } = req.body || {};
    if (!startDate) {
      return res.status(400).json(new ApiError(400, "startDate is required"));
    }
    if (!["weekly", "monthly"].includes(planType)) {
      return res.status(400).json(new ApiError(400, "planType must be weekly or monthly"));
    }

    const user = await User.findOne({ authId });
    if (!user) {
      return res.status(404).json(new ApiError(404, "User profile not found"));
    }

    const latestWeight = await getLatestMetric(authId, "weight");
    if (!latestWeight) {
      return res.status(400).json(
        new ApiError(400, "Weight metric not found; add body metrics first"),
      );
    }

    const weightKg = Number(latestWeight.value);
    const tdee = await resolveTdee(authId);
    if (!tdee) {
      return res.status(400).json(
        new ApiError(400, "Unable to resolve TDEE; ensure metrics exist"),
      );
    }

    const start = startOfDay(new Date(startDate));
    if (!isValidDate(start)) {
      return res.status(400).json(new ApiError(400, "Invalid startDate format"));
    }

    const targets = getMacroTargetsFromTdee(tdee, weightKg);
    const days = planDaysForType(planType);
    const endDate = startOfDay(new Date(start));
    endDate.setDate(endDate.getDate() + (days - 1));

    const plans = [];

    for (let index = 0; index < days; index += 1) {
      const currentDate = startOfDay(new Date(start));
      currentDate.setDate(start.getDate() + index);

      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const built = await buildMealsFromFoodCsv(user, targets);
      if (!built) continue;

      const { meals, mealGoals } = built;
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
        },
      );

      plans.push(plan);
    }

    const activeSub = await getActiveSubscriptionForPlan(authId, planType, start, endDate);
    if (activeSub && plans[0]?._id) {
      const assignedDoctor = await DoctorPatient.findOne({
        patientAuthId: authId,
        status: "active",
      });

      if (assignedDoctor?.doctorAuthId) {
        const weight = await getLatestNumberMetricValue(authId, "weight");
        const bmi = await getLatestNumberMetricValue(authId, "bmi");
        const bmr = await getLatestNumberMetricValue(authId, "bmr");
        const latestTdeeValue = await getLatestNumberMetricValue(authId, "tdee");

        await DoctorReviewRequest.findOneAndUpdate(
          {
            doctorAuthId: assignedDoctor.doctorAuthId,
            patientAuthId: authId,
            dietPlanId: plans[0]._id,
          },
          {
            $set: {
              subscriptionId: activeSub._id,
              snapshot: { weight, bmi, bmr, tdee: latestTdeeValue },
              status: "pending",
              reviewedAt: null,
            },
          },
          { upsert: true, new: true },
        );
      }
    }

    await markPastPlansCompleted(authId, startOfDay(new Date()));

    const cycleResult = await manageWeeklyCycle(user._id, plans[0]._id);
    void cycleResult;

    return res.status(201).json(
      new ApiResponse(
        201,
        { plans, subscription: activeSub || null },
        `${days}-day diet plan created/updated successfully`,
      ),
    );
  } catch (error) {
    console.error("Error in createDietPlan:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const listDietPlans = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const todayStart = startOfDay(new Date());
    await markPastPlansCompleted(authId, todayStart);

    const plans = await DietPlan.find({
      authId,
      status: "active",
      startDate: { $gte: todayStart },
    }).sort({ startDate: 1, createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, plans, "Diet plans fetched successfully"));
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
    const plan = await DietPlan.findOne({
      _id: id,
      authId,
      status: "active",
      startDate: { $gte: startOfDay(new Date()) },
    });

    if (!plan) {
      return res.status(404).json(new ApiError(404, "Diet plan not found"));
    }

    return res.status(200).json(new ApiResponse(200, plan, "Diet plan fetched successfully"));
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
      return res.status(404).json(new ApiError(404, "Diet plan not found"));
    }

    return res.status(200).json(new ApiResponse(200, plan, "Diet plan updated successfully"));
  } catch (error) {
    console.error("Error in updateDietPlanStatus:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while updating diet"));
  }
};

export const getTodayDietPlan = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    await markPastPlansCompleted(authId, todayStart);

    const plan = await DietPlan.findOne({
      authId,
      status: "active",
      startDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    }).sort({ createdAt: -1 });

    if (!plan) {
      return res
        .status(404)
        .json(new ApiError(404, "No active diet plan found for today"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, plan, "Today's diet plan fetched successfully"));
  } catch (error) {
    console.error("Error in getTodayDietPlan:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching today's diet"));
  }
};

export const getWeeklyDietPlan = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const todayStart = startOfDay(new Date());
    await markPastPlansCompleted(authId, todayStart);

    const weeklyPlans = await DietPlan.find({
      authId,
      status: "active",
      startDate: { $gte: todayStart },
    }).sort({ startDate: 1, createdAt: -1 });

    if (!weeklyPlans.length) {
      return res.status(404).json(new ApiError(404, "No active diet plans found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, weeklyPlans, "Weekly diet plans fetched successfully"));
  } catch (error) {
    console.error("Error in getWeeklyDietPlan:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching weekly diet plans"));
  }
};

export const markTodayDietAsFollowed = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const plan = await DietPlan.findOne({
      authId,
      status: "active",
      startDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    }).sort({ createdAt: -1 });

    if (!plan) {
      return res.status(404).json(new ApiError(404, "No diet plan available for today"));
    }

    if (plan.isFollowed) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { plan, streaks: await calculateDietStreakStats(authId) },
          "Today's diet was already marked as followed",
        ),
      );
    }

    plan.isFollowed = true;
    plan.followedAt = new Date();
    await plan.save();

    const streaks = await calculateDietStreakStats(authId);
    return res
      .status(200)
      .json(new ApiResponse(200, { plan, streaks }, "Today's diet marked as followed"));
  } catch (error) {
    console.error("Error in markTodayDietAsFollowed:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while marking today's diet"));
  }
};

export const getDietStreakStats = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const streaks = await calculateDietStreakStats(authId);
    return res
      .status(200)
      .json(new ApiResponse(200, streaks, "Diet streak stats fetched successfully"));
  } catch (error) {
    console.error("Error in getDietStreakStats:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching diet streaks"));
  }
};
