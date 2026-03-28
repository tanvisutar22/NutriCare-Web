import DoctorPatient from "../models/doctorPatient.model.js";
import Doctor from "../models/doctor.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import DietPlan from "../models/diet.model.js";
import Subscription from "../models/subscription.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import { auth as Auth } from "../models/auth.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getDoctorSelectionsForPatients,
  isDoctorSelectedForPatient,
} from "../utils/doctorSelection.js";

const normalizeId = (value) => (value ? String(value) : "");

const getLatestMetricValueMap = async (patientAuthIds = []) => {
  const metrics = await BodyMetrics.find({
    authId: { $in: patientAuthIds },
    metricType: { $in: ["weight"] },
  }).sort({ recordedAt: -1, createdAt: -1 });

  const latestByPatient = new Map();
  for (const metric of metrics) {
    const patientId = normalizeId(metric.authId);
    if (!patientId || latestByPatient.has(patientId)) continue;
    latestByPatient.set(patientId, Number(metric.value) || null);
  }

  return latestByPatient;
};

const getSubscriptionMap = async (patientAuthIds = []) => {
  const subscriptions = await Subscription.find({
    patientAuthId: { $in: patientAuthIds },
  }).sort({ endDate: -1, createdAt: -1 });

  const subscriptionMap = new Map();
  for (const subscription of subscriptions) {
    const patientId = normalizeId(subscription.patientAuthId);
    if (!patientId || subscriptionMap.has(patientId)) continue;
    subscriptionMap.set(patientId, subscription);
  }

  return subscriptionMap;
};

const getDietSummaryMap = async (patientAuthIds = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diets = await DietPlan.find({
    authId: { $in: patientAuthIds },
    status: "active",
    startDate: { $gte: today },
  }).sort({ startDate: 1, createdAt: -1 });

  const dietMap = new Map();
  for (const diet of diets) {
    const patientId = normalizeId(diet.authId);
    if (!patientId || dietMap.has(patientId)) continue;

    const mealNames = ["breakfast", "lunch", "dinner"]
      .flatMap((mealKey) => (diet.meals?.[mealKey] || []).map((food) => food.foodName).filter(Boolean))
      .slice(0, 4);

    dietMap.set(patientId, {
      planId: diet._id,
      startDate: diet.startDate,
      status: diet.status,
      meals: mealNames,
      calorieTarget: diet.calorieTarget,
    });
  }

  return dietMap;
};

const buildPatientCards = async (doctorAuthId) => {
  const mappings = await DoctorPatient.find({
    doctorAuthId,
    status: "active",
  }).sort({ createdAt: -1 });

  const patientAuthIds = mappings.map((mapping) => mapping.patientAuthId);
  const selectionMap = await getDoctorSelectionsForPatients(patientAuthIds);

  const validMappings = mappings.filter((mapping) =>
    isDoctorSelectedForPatient(selectionMap, mapping.patientAuthId, doctorAuthId),
  );

  const validPatientAuthIds = validMappings.map((mapping) => mapping.patientAuthId);
  if (!validPatientAuthIds.length) return [];

  const [profiles, latestWeights, subscriptions, diets, noteCounts] = await Promise.all([
    User.find({ authId: { $in: validPatientAuthIds } }),
    getLatestMetricValueMap(validPatientAuthIds),
    getSubscriptionMap(validPatientAuthIds),
    getDietSummaryMap(validPatientAuthIds),
    DoctorNote.aggregate([
      {
        $match: {
          doctorAuthId,
          patientAuthId: { $in: validPatientAuthIds },
        },
      },
      {
        $group: {
          _id: "$patientAuthId",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const profileMap = new Map(profiles.map((profile) => [normalizeId(profile.authId), profile]));
  const noteCountMap = new Map(noteCounts.map((row) => [normalizeId(row._id), row.count]));

  return validMappings.map((mapping) => {
    const patientId = normalizeId(mapping.patientAuthId);
    const profile = profileMap.get(patientId);
    const subscription = subscriptions.get(patientId);
    const dietSummary = diets.get(patientId);

    return {
      mappingId: mapping._id,
      patientAuthId: mapping.patientAuthId,
      assignedAt: mapping.createdAt,
      name: profile?.name || "Unknown patient",
      age: profile?.age ?? null,
      gender: profile?.gender || "",
      weight: latestWeights.get(patientId) ?? null,
      height: profile?.height ?? null,
      goal: profile?.goal || "",
      subscriptionStatus: subscription?.status || "inactive",
      latestDietPlanSummary: dietSummary || null,
      noteCount: noteCountMap.get(patientId) || 0,
    };
  });
};

export const assignPatientToDoctor = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.body || {};

    if (!patientAuthId) {
      return res.status(400).json(new ApiError(400, "patientAuthId is required"));
    }

    const [patient, doctorProfile] = await Promise.all([
      Auth.findById(patientAuthId),
      Doctor.findOne({ authId: doctorAuthId }),
    ]);

    if (!patient) {
      return res.status(404).json(new ApiError(404, "Patient not found"));
    }

    if (patient.userType !== "User") {
      return res.status(400).json(new ApiError(400, "Selected account is not a patient"));
    }

    if (!doctorProfile?.isApproved) {
      return res.status(403).json(new ApiError(403, "Doctor is not approved for assignments"));
    }

    const existingAssignment = await DoctorPatient.findOne({
      patientAuthId,
      status: "active",
    });

    if (existingAssignment && String(existingAssignment.doctorAuthId) !== String(doctorAuthId)) {
      return res
        .status(409)
        .json(new ApiError(409, "Patient is already assigned to another doctor"));
    }

    if (existingAssignment) {
      return res
        .status(200)
        .json(new ApiResponse(200, existingAssignment, "Patient already assigned"));
    }

    const mapping = await DoctorPatient.create({
      doctorAuthId,
      patientAuthId,
      status: "active",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, mapping, "Patient assigned successfully"));
  } catch (error) {
    console.error("Error in assignPatientToDoctor:", error);
    if (error?.code === 11000) {
      return res
        .status(409)
        .json(new ApiError(409, "Patient is already assigned to another doctor"));
    }
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getAssignedPatients = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const patientCards = await buildPatientCards(doctorAuthId);

    return res
      .status(200)
      .json(new ApiResponse(200, patientCards, "Assigned patients fetched successfully"));
  } catch (error) {
    console.error("Error in getAssignedPatients:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const removeAssignedPatient = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.params;

    const mapping = await DoctorPatient.findOneAndUpdate(
      {
        doctorAuthId,
        patientAuthId,
        status: "active",
      },
      {
        status: "removed",
      },
      { new: true },
    );

    if (!mapping) {
      return res.status(404).json(new ApiError(404, "Assigned patient not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, mapping, "Patient removed successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};
