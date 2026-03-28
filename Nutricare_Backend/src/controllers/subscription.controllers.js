import { auth as Auth } from "../models/auth.model.js";
import AdminWalletTransaction from "../models/adminWalletTransaction.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const PLAN_DETAILS = {
  weekly: { amount: 299, label: "Weekly Plan", days: 7 },
  monthly: { amount: 499, label: "Monthly Plan", days: 30 },
};

const normalizeStartOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeEndOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getPlanConfig = (planType) => PLAN_DETAILS[planType] || null;
const buildValidityWindow = (planType, currentSubscription = null) => {
  const plan = getPlanConfig(planType);
  if (!plan) return null;

  const nowStart = normalizeStartOfDay(new Date());
  const currentEnd =
    currentSubscription?.status === "active" &&
    currentSubscription?.endDate &&
    new Date(currentSubscription.endDate) >= nowStart
      ? normalizeEndOfDay(currentSubscription.endDate)
      : null;

  const validityStart = currentEnd
    ? normalizeStartOfDay(new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000))
    : nowStart;

  const validityEnd = normalizeEndOfDay(validityStart);
  validityEnd.setDate(validityStart.getDate() + (plan.days - 1));

  return { validityStart, validityEnd, plan };
};

const getRemainingDays = (subscription) => {
  if (!subscription?.endDate) return 0;
  const now = new Date();
  const end = new Date(subscription.endDate);
  if (end < now) return 0;
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

const getAdminAuthId = async () => {
  const admin = await Auth.findOne({ userType: "Admin" }).select("_id");
  return admin?._id || null;
};

const markExpiredSubscriptions = async (patientAuthId) => {
  await Subscription.updateMany(
    {
      patientAuthId,
      status: "active",
      endDate: { $lt: new Date() },
    },
    {
      $set: { status: "expired" },
    },
  );
};

const getActiveSubscription = async (patientAuthId) => {
  await markExpiredSubscriptions(patientAuthId);
  return Subscription.findOne({
    patientAuthId,
    status: "active",
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });
};

const getActiveSubscriptionConflictMessage = (subscription) =>
  subscription?.endDate
    ? `You already have an active subscription until ${new Date(subscription.endDate).toLocaleDateString()}. Upgrade will be available after the current plan ends.`
    : "You already have an active subscription.";

export const listSubscriptionPlans = async (_req, res) => {
  const plans = Object.entries(PLAN_DETAILS).map(([planType, config]) => ({
    planType,
    label: config.label,
    amount: config.amount,
    durationDays: config.days,
    currency: "INR",
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, plans, "Subscription plans fetched"));
};

export const createMockPaymentIntent = async (req, res) => {
  try {
    const payerAuthId = req.user?._id;
    if (!payerAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { planType, paymentMethod = "mock" } = req.body || {};
    const plan = getPlanConfig(planType);

    if (!plan) {
      return res.status(400).json(new ApiError(400, "Invalid subscription plan"));
    }

    const activeSubscription = await getActiveSubscription(payerAuthId);
    if (activeSubscription) {
      return res
        .status(409)
        .json(new ApiError(409, getActiveSubscriptionConflictMessage(activeSubscription)));
    }

    const payment = await Payment.create({
      payerAuthId,
      planType,
      amount: plan.amount,
      paymentMethod,
      provider: "mock",
      status: "pending",
      verificationStatus: "unverified",
      transactionId: `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      meta: {
        gateway: "mock",
        planLabel: plan.label,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, payment, "Mock payment initiated"));
  } catch (error) {
    console.error("Error in createMockPaymentIntent:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const verifyAndActivateSubscription = async (req, res) => {
  try {
    const payerAuthId = req.user?._id;
    if (!payerAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { paymentId, simulateStatus = "success" } = req.body || {};
    if (!paymentId) {
      return res.status(400).json(new ApiError(400, "paymentId is required"));
    }

    const payment = await Payment.findOne({ _id: paymentId, payerAuthId });
    if (!payment) {
      return res.status(404).json(new ApiError(404, "Payment intent not found"));
    }

    if (payment.verificationStatus === "verified") {
      await markExpiredSubscriptions(payerAuthId);
      const currentSubscription = await Subscription.findOne({
        patientAuthId: payerAuthId,
      }).sort({ updatedAt: -1 });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            subscription: currentSubscription,
            payment,
          },
          "Payment already verified",
        ),
      );
    }

    if (simulateStatus !== "success") {
      payment.status = "failed";
      payment.verificationStatus = "rejected";
      payment.meta = {
        ...payment.meta,
        failureReason: "Mock gateway declined the transaction",
      };
      await payment.save();

      return res.status(400).json(new ApiError(400, "Mock payment failed"));
    }

    const plan = getPlanConfig(payment.planType);
    if (!plan || Number(payment.amount) !== Number(plan.amount)) {
      return res
        .status(400)
        .json(new ApiError(400, "Payment details do not match the plan"));
    }

    const activeSubscription = await getActiveSubscription(payerAuthId);
    if (activeSubscription) {
      return res
        .status(409)
        .json(new ApiError(409, getActiveSubscriptionConflictMessage(activeSubscription)));
    }

    const { validityStart, validityEnd } = buildValidityWindow(payment.planType, null);

    payment.status = "verified";
    payment.verificationStatus = "verified";
    payment.verifiedAt = new Date();
    payment.validityStart = validityStart;
    payment.validityEnd = validityEnd;
    payment.meta = {
      ...payment.meta,
      verifiedBy: "mock-gateway",
    };
    await payment.save();

    const subscription = await Subscription.create({
      patientAuthId: payerAuthId,
      planType: payment.planType,
      startDate: validityStart,
      endDate: validityEnd,
      status: "active",
      paymentId: payment._id,
      paymentIds: [payment._id],
      totalPaidAmount: Number(payment.amount || 0),
    });

    const adminAuthId = await getAdminAuthId();
    if (adminAuthId) {
      await AdminWalletTransaction.create({
        adminAuthId,
        type: "credit_subscription",
        amount: payment.amount,
        referenceType: "Payment",
        referenceId: payment._id,
        meta: {
          payerAuthId,
          planType: payment.planType,
          transactionId: payment.transactionId,
        },
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscription,
          payment,
          remainingDays: getRemainingDays(subscription),
        },
        "Subscription activated successfully",
      ),
    );
  } catch (error) {
    console.error("Error in verifyAndActivateSubscription:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const purchaseSubscription = async (req, res) => {
  try {
    const payerAuthId = req.user?._id;
    if (!payerAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { planType, paymentMethod = "mock" } = req.body || {};
    const plan = getPlanConfig(planType);
    if (!plan) {
      return res.status(400).json(new ApiError(400, "Invalid subscription plan"));
    }

    const activeSubscription = await getActiveSubscription(payerAuthId);
    if (activeSubscription) {
      return res
        .status(409)
        .json(new ApiError(409, getActiveSubscriptionConflictMessage(activeSubscription)));
    }

    const payment = await Payment.create({
      payerAuthId,
      planType,
      amount: plan.amount,
      paymentMethod,
      provider: "mock",
      status: "pending",
      verificationStatus: "unverified",
      transactionId: `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      meta: {
        gateway: "mock",
        flow: "legacy-purchase",
        planLabel: plan.label,
      },
    });

    req.body = {
      paymentId: payment._id,
      simulateStatus: "success",
    };

    return verifyAndActivateSubscription(req, res);
  } catch (error) {
    console.error("Error in purchaseSubscription:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const getMyActiveSubscription = async (req, res) => {
  try {
    const patientAuthId = req.user?._id;
    if (!patientAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    await markExpiredSubscriptions(patientAuthId);

    const subscription = await Subscription.findOne({
      patientAuthId,
      status: "active",
      endDate: { $gte: new Date() },
    })
      .sort({ endDate: -1 })
      .populate("paymentId");

    return res.status(200).json(
      new ApiResponse(
        200,
        subscription
          ? {
              ...subscription.toObject(),
              remainingDays: getRemainingDays(subscription),
            }
          : null,
        "Subscription fetched",
      ),
    );
  } catch (error) {
    console.error("Error in getMyActiveSubscription:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export const getMySubscriptionHistory = async (req, res) => {
  try {
    const patientAuthId = req.user?._id;
    if (!patientAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    await markExpiredSubscriptions(patientAuthId);

    const [subscriptions, payments] = await Promise.all([
      Subscription.find({ patientAuthId }).sort({ createdAt: -1 }).populate("paymentId"),
      Payment.find({ payerAuthId: patientAuthId }).sort({ createdAt: -1 }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptions,
          payments,
        },
        "Subscription history fetched",
      ),
    );
  } catch (error) {
    console.error("Error in getMySubscriptionHistory:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};
