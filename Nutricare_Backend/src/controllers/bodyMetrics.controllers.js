import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import User from "../models/user.model.js";

const getLatestMetric = async (authId, metricType) => {
  return BodyMetrics.findOne({ authId, metricType }).sort({ recordedAt: -1 });
};

const activityFactorFromValue = (value) => {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    const map = {
      sedentary: 1.2,
      "lightly_active": 1.375,
      "lightly active": 1.375,
      "moderately_active": 1.55,
      "moderately active": 1.55,
      "very_active": 1.725,
      "very active": 1.725,
      "extra_active": 1.9,
      "extra active": 1.9,
    };
    if (map[normalized]) return map[normalized];
  }

  // default light activity
  return 1.375;
};

const recalculateDerivedMetrics = async (authId) => {
  const user = await User.findOne({ authId });
  if (!user) return;

  const weightMetric = await getLatestMetric(authId, "weight");
  if (!weightMetric) return;

  const activityMetric = await getLatestMetric(authId, "activityLevel");

  const weight = Number(weightMetric.value);
  const heightCm = Number(user.height);
  const age = Number(user.age);

  if (!weight || !heightCm || !age) return;

  const heightM = heightCm / 100;
  const bmi = weightM2Safe(weight, heightM);

  const bmr = calculateBmr(weight, heightCm, age, user.gender);

  const activityFactor = activityMetric
    ? activityFactorFromValue(activityMetric.value)
    : 1.375;

  const tdee = Math.round(bmr * activityFactor);

  const now = new Date();

  await BodyMetrics.create([
    {
      authId,
      metricType: "bmi",
      value: bmi,
      recordedAt: now,
    },
    {
      authId,
      metricType: "bmr",
      value: bmr,
      recordedAt: now,
    },
    {
      authId,
      metricType: "tdee",
      value: tdee,
      recordedAt: now,
    },
  ]);
};

const weightM2Safe = (weight, heightM) => {
  if (!heightM) return null;
  const value = weight / (heightM * heightM);
  return Math.round(value * 10) / 10;
};

const calculateBmr = (weight, heightCm, age, gender) => {
  const base =
    10 * weight + 6.25 * heightCm - 5 * age + (gender === "male" ? 5 : -161);
  return Math.round(base);
};

export const createBodyMetric = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { metricType, value, recordedAt } = req.body || {};

    if (!metricType || typeof value === "undefined") {
      return res
        .status(400)
        .json(new ApiError(400, "metricType and value are required"));
    }

    const metric = await BodyMetrics.create({
      authId,
      metricType,
      value,
      recordedAt: recordedAt ? new Date(recordedAt) : undefined,
    });

    // Recalculate BMI, BMR, TDEE when relevant metrics are updated
    if (["weight", "activityLevel"].includes(metricType)) {
      await recalculateDerivedMetrics(authId);
    }

    return res
      .status(201)
      .json(new ApiResponse(201, metric, "Body metric created successfully"));
  } catch (error) {
    console.error("Error in createBodyMetric:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while creating metric"));
  }
};

export const listBodyMetrics = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { metricType } = req.query || {};

    const filter = { authId };
    if (metricType) {
      filter.metricType = metricType;
    }

    const metrics = await BodyMetrics.find(filter).sort({ recordedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, metrics, "Body metrics fetched successfully"));
  } catch (error) {
    console.error("Error in listBodyMetrics:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching metrics"));
  }
};

export const getBodyMetricById = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { id } = req.params;

    const metric = await BodyMetrics.findOne({ _id: id, authId });
    if (!metric) {
      return res
        .status(404)
        .json(new ApiError(404, "Body metric not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, metric, "Body metric fetched successfully"));
  } catch (error) {
    console.error("Error in getBodyMetricById:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while fetching metric"));
  }
};

export const updateBodyMetric = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { id } = req.params;
    const updates = req.body || {};

    const existing = await BodyMetrics.findOne({ _id: id, authId });
    if (!existing) {
      return res
        .status(404)
        .json(new ApiError(404, "Body metric not found"));
    }

    const metric = await BodyMetrics.findOneAndUpdate(
      { _id: id, authId },
      updates,
      { new: true, runValidators: true },
    );

    if (["weight", "activityLevel"].includes(metric.metricType)) {
      await recalculateDerivedMetrics(authId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, metric, "Body metric updated successfully"));
  } catch (error) {
    console.error("Error in updateBodyMetric:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while updating metric"));
  }
};

export const deleteBodyMetric = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { id } = req.params;

    const metric = await BodyMetrics.findOneAndDelete({ _id: id, authId });
    if (!metric) {
      return res
        .status(404)
        .json(new ApiError(404, "Body metric not found"));
    }

    if (["weight", "activityLevel"].includes(metric.metricType)) {
      await recalculateDerivedMetrics(authId);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Body metric deleted successfully"));
  } catch (error) {
    console.error("Error in deleteBodyMetric:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error while deleting metric"));
  }
};

