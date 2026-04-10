import ActivityLog from "../models/activityLog.model.js";
import DoctorPatient from "../models/doctorPatient.model.js";
import DoctorNote from "../models/doctorNote.model.js";
import DoctorReviewRequest from "../models/doctorReviewRequest.model.js";
import User from "../models/user.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import DietPlan from "../models/diet.model.js";
import DoctorWalletTransaction from "../models/doctorWalletTransaction.model.js";
import MealLog from "../models/mealLogs.model.js";
import Subscription from "../models/subscription.model.js";
import DoctorMonthlyPayout from "../models/doctorMonthlyPayout.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getDoctorSelectionForPatient,
  getDoctorSelectionsForPatients,
  isDoctorSelectedForPatient,
} from "../utils/doctorSelection.js";

const normalizeId = (value) => (value ? String(value) : "");

const buildDoctorWalletSnapshot = ({ payouts = [], withdrawals = [] }) => {
  const totalPaid = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + Number(payout.totalAmount || 0), 0);
  const pendingAmount = payouts
    .filter((payout) => payout.status === "pending" && Number(payout.totalAmount || 0) > 0)
    .reduce((sum, payout) => sum + Number(payout.totalAmount || 0), 0);
  const totalWithdrawn = withdrawals.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  return {
    totalPaid,
    pendingAmount,
    totalWithdrawn,
    balance: Math.max(totalPaid - totalWithdrawn, 0),
  };
};

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildAssignedPatientCards = async (doctorAuthId) => {
  const mappings = await DoctorPatient.find({
    doctorAuthId,
    status: "active",
  }).sort({ createdAt: -1 });

  const patientAuthIds = mappings.map((mapping) => mapping.patientAuthId);
  const selections = await getDoctorSelectionsForPatients(patientAuthIds);
  const validMappings = mappings.filter((mapping) =>
    isDoctorSelectedForPatient(selections, mapping.patientAuthId, doctorAuthId),
  );

  const validPatientIds = validMappings.map((mapping) => mapping.patientAuthId);
  if (!validPatientIds.length) return [];

  const [profiles, metrics, subscriptions, diets] = await Promise.all([
    User.find({ authId: { $in: validPatientIds } }),
    BodyMetrics.find({
      authId: { $in: validPatientIds },
      metricType: { $in: ["weight"] },
    }).sort({ recordedAt: -1, createdAt: -1 }),
    Subscription.find({ patientAuthId: { $in: validPatientIds } }).sort({ endDate: -1, createdAt: -1 }),
    DietPlan.find({
      authId: { $in: validPatientIds },
      status: "active",
      startDate: { $gte: startOfDay(new Date()) },
    }).sort({ startDate: 1, createdAt: -1 }),
  ]);

  const profileMap = new Map(profiles.map((profile) => [normalizeId(profile.authId), profile]));
  const metricMap = new Map();
  for (const metric of metrics) {
    const patientId = normalizeId(metric.authId);
    if (!patientId || metricMap.has(patientId)) continue;
    metricMap.set(patientId, Number(metric.value) || null);
  }

  const subscriptionMap = new Map();
  for (const subscription of subscriptions) {
    const patientId = normalizeId(subscription.patientAuthId);
    if (!patientId || subscriptionMap.has(patientId)) continue;
    subscriptionMap.set(patientId, subscription);
  }

  const dietMap = new Map();
  for (const diet of diets) {
    const patientId = normalizeId(diet.authId);
    if (!patientId || dietMap.has(patientId)) continue;

    dietMap.set(patientId, {
      planId: diet._id,
      startDate: diet.startDate,
      status: diet.status,
      meals: ["breakfast", "lunch", "dinner"]
        .flatMap((mealKey) => (diet.meals?.[mealKey] || []).map((food) => food.foodName).filter(Boolean))
        .slice(0, 4),
    });
  }

  return validMappings.map((mapping) => {
    const patientId = normalizeId(mapping.patientAuthId);
    const profile = profileMap.get(patientId);
    const subscription = subscriptionMap.get(patientId);

    return {
      patientAuthId: mapping.patientAuthId,
      mappingId: mapping._id,
      assignedAt: mapping.createdAt,
      name: profile?.name || "Unknown patient",
      age: profile?.age ?? null,
      gender: profile?.gender || "",
      weight: metricMap.get(patientId) ?? null,
      height: profile?.height ?? null,
      goal: profile?.goal || "",
      subscriptionStatus: subscription?.status || "inactive",
      latestDietPlanSummary: dietMap.get(patientId) || null,
    };
  });
};

export const getDoctorDashboardSummary = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const [patientCards, totalNotes, pendingRequests] = await Promise.all([
      buildAssignedPatientCards(doctorAuthId),
      DoctorNote.countDocuments({ doctorAuthId }),
      DoctorReviewRequest.countDocuments({ doctorAuthId, status: "pending" }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalPatients: patientCards.length,
          totalNotes,
          pendingRequests,
          recentPatients: patientCards.slice(0, 5),
        },
        "Doctor dashboard summary fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getPatientFullDetails = async (req, res) => {
  try {
    const doctorAuthId = req.user._id;
    const { patientAuthId } = req.params;

    const [mapping, selection] = await Promise.all([
      DoctorPatient.findOne({
        doctorAuthId,
        patientAuthId,
        status: "active",
      }),
      getDoctorSelectionForPatient(patientAuthId),
    ]);

    if (!mapping || !selection?.doctorAuthId || String(selection.doctorAuthId) !== String(doctorAuthId)) {
      return res
        .status(403)
        .json(new ApiError(403, "Patient is not assigned to this doctor"));
    }

    const today = startOfDay(new Date());
    const [patientProfile, metrics, diets, notes, mealLogs, activityLogs, reviewRequests, subscription] =
      await Promise.all([
        User.findOne({ authId: patientAuthId }),
        BodyMetrics.find({ authId: patientAuthId }).sort({ recordedAt: -1, createdAt: -1 }),
        DietPlan.find({ authId: patientAuthId }).sort({ startDate: -1, createdAt: -1 }),
        DoctorNote.find({ doctorAuthId, patientAuthId }).sort({ createdAt: -1 }),
        MealLog.find({ authId: patientAuthId }).sort({ date: -1, createdAt: -1 }).limit(20),
        ActivityLog.find({ userId: patientAuthId }).sort({ date: -1, createdAt: -1 }).limit(20),
        DoctorReviewRequest.find({ doctorAuthId, patientAuthId }).sort({ createdAt: -1 }).limit(20),
        Subscription.findOne({ patientAuthId }).sort({ endDate: -1, createdAt: -1 }),
      ]);

    const currentActiveDietPlan =
      [...diets]
        .filter((diet) => diet.status === "active" && new Date(diet.startDate) >= today)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || null;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          patientProfile,
          metrics,
          diets,
          currentActiveDietPlan,
          notes,
          mealLogs,
          activityLogs,
          reviewRequests,
          subscription,
        },
        "Patient full details fetched successfully",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export const getDoctorWallet = async (req, res) => {
  try {
    const doctorAuthId = req.user?._id;
    if (!doctorAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const [txs, payouts] = await Promise.all([
      DoctorWalletTransaction.find({ doctorAuthId }).sort({ createdAt: -1 }).limit(200),
      DoctorMonthlyPayout.find({ doctorAuthId }).sort({ createdAt: -1 }).limit(200),
    ]);

    const walletSnapshot = buildDoctorWalletSnapshot({
      payouts,
      withdrawals: txs.filter((transaction) => transaction.type === "debit_withdrawal"),
    });
    const paidPayouts = payouts.filter((payout) => payout.status === "paid");
    const latestPaidPayout = paidPayouts[0] || null;

    const transactions = [...txs];
    const existingCreditRefs = new Set(
      txs
        .filter((transaction) => transaction.type === "credit_payout" && transaction.referenceId)
        .map((transaction) => normalizeId(transaction.referenceId)),
    );
    for (const payout of paidPayouts) {
      const payoutId = normalizeId(payout._id);
      if (payoutId && !existingCreditRefs.has(payoutId)) {
        transactions.push({
          _id: `synthetic-${payoutId}`,
          doctorAuthId,
          type: "credit_payout",
          amount: payout.totalAmount,
          referenceType: "DoctorMonthlyPayout",
          referenceId: payout._id,
          meta: { monthKey: payout.monthKey, synthetic: true },
          createdAt: payout.paidAt || payout.updatedAt || payout.createdAt,
        });
      }
    }
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          balance: walletSnapshot.balance,
          totalPaid: walletSnapshot.totalPaid,
          pendingAmount: walletSnapshot.pendingAmount,
          totalWithdrawn: walletSnapshot.totalWithdrawn,
          latestPaidPayout,
          transactions,
          payouts,
        },
        "Wallet fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error in getDoctorWallet:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
