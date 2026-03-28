import MealLog from "../models/mealLogs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const normalizeMealType = (mealType = "") => {
  const value = String(mealType).trim().toLowerCase();
  return value === "snacks" ? "snack" : value;
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

const sanitizeFoods = (foods = []) =>
  (Array.isArray(foods) ? foods : [])
    .map((food) => ({
      name: String(food?.name || "").trim(),
      quantity: Number(food?.quantity || 0),
      unit: String(food?.unit || "").trim(),
    }))
    .filter((food) => food.name);

const buildNutrition = (nutrition = {}) => ({
  calories: Number(nutrition.calories || 0),
  protein: Number(nutrition.protein || 0),
  carbs: Number(nutrition.carbs || 0),
  fat: Number(nutrition.fat || 0),
});

export const upsertMealLog = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const {
      mealType,
      foods,
      nutrition,
      date = new Date(),
      source = "manual",
    } = req.body || {};

    const normalizedMealType = normalizeMealType(mealType);
    if (!["breakfast", "lunch", "dinner", "snack"].includes(normalizedMealType)) {
      return res.status(400).json(new ApiError(400, "Invalid mealType"));
    }

    const normalizedDate = startOfDay(date);
    if (Number.isNaN(normalizedDate.getTime())) {
      return res.status(400).json(new ApiError(400, "Invalid date"));
    }

    const payload = {
      foods: sanitizeFoods(foods),
      nutrition: buildNutrition(nutrition),
      source,
    };

    const mealLog = await MealLog.findOneAndUpdate(
      {
        authId,
        date: normalizedDate,
        mealType: normalizedMealType,
      },
      {
        $set: payload,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, mealLog, "Meal log saved successfully"));
  } catch (error) {
    console.error("Error in upsertMealLog:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const listMealLogs = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { date, from, to } = req.query || {};
    let query = { authId };

    if (date) {
      query.date = {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      };
    } else if (from || to) {
      query.date = {};
      if (from) query.date.$gte = startOfDay(from);
      if (to) query.date.$lte = endOfDay(to);
    }

    const rows = await MealLog.find(query).sort({ date: -1, mealType: 1 });
    return res
      .status(200)
      .json(new ApiResponse(200, rows, "Meal logs fetched successfully"));
  } catch (error) {
    console.error("Error in listMealLogs:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const getMealLogSummary = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const day = startOfDay(req.query?.date || new Date());
    const rows = await MealLog.find({
      authId,
      date: {
        $gte: day,
        $lte: endOfDay(day),
      },
    }).sort({ mealType: 1 });

    const totals = rows.reduce(
      (acc, row) => {
        acc.calories += Number(row.nutrition?.calories || 0);
        acc.protein += Number(row.nutrition?.protein || 0);
        acc.carbs += Number(row.nutrition?.carbs || 0);
        acc.fat += Number(row.nutrition?.fat || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          date: day,
          totals,
          rows,
        },
        "Meal log summary fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getMealLogSummary:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
