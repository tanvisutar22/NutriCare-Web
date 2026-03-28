import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import DailyTracking from "../models/dailyTracking.model.js";
import {
  calculateStreaks,
  getMonthlyTrackingMap,
} from "../services/streak.service.js";
import { calculateRiskAlerts } from "../services/risk.service.js";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toTrackedFlag = (payload = {}) =>
  Boolean(Number(payload.steps) > 0 || Number(payload.waterIntake) > 0 || payload.mood);

export async function upsertDailyTracking(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { date, steps, waterIntake, mood } = req.body || {};
    const normalizedDate = startOfDay(date || new Date());

    const row = await DailyTracking.findOneAndUpdate(
      { userId, date: normalizedDate },
      {
        userId,
        date: normalizedDate,
        steps: Number(steps) || 0,
        waterIntake: Number(waterIntake) || 0,
        mood: mood || "happy",
        isTracked: toTrackedFlag({ steps, waterIntake, mood }),
      },
      { new: true, upsert: true, runValidators: true },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, row, "Daily tracking saved successfully"));
  } catch (error) {
    console.error("Error in upsertDailyTracking:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
}

export async function getTodayTracking(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const row = await DailyTracking.findOne({
      userId,
      date: startOfDay(new Date()),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, row, "Today tracking fetched successfully"));
  } catch (error) {
    console.error("Error in getTodayTracking:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
}

export async function getTrackingStatus(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;

    const [streaks, calendar, risks] = await Promise.all([
      calculateStreaks(userId, now),
      getMonthlyTrackingMap(userId, year, month),
      calculateRiskAlerts(userId),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        { streaks, calendar, risks },
        "Tracking status fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getTrackingStatus:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
}
