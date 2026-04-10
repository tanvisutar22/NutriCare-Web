import { auth as Auth } from "../models/auth.model.js";
import AdminWalletTransaction from "../models/adminWalletTransaction.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createRazorpayOrder,
  getRazorpayCheckoutConfig,
  verifyRazorpaySignature,
} from "../services/payment.service.js";

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

const activateSubscriptionForPayment = async ({ payment, payerAuthId }) => {
  const plan = getPlanConfig(payment.planType);
  if (!plan || Number(payment.amount) !== Number(plan.amount)) {
    throw new ApiError(400, "Payment details do not match the plan");
  }

  const activeSubscription = await getActiveSubscription(payerAuthId);
  if (activeSubscription) {
    throw new ApiError(409, getActiveSubscriptionConflictMessage(activeSubscription));
  }

  const { validityStart, validityEnd } = buildValidityWindow(payment.planType, null);

  payment.status = "verified";
  payment.verificationStatus = "verified";
  payment.verifiedAt = new Date();
  payment.validityStart = validityStart;
  payment.validityEnd = validityEnd;
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

  return {
    subscription,
    payment,
    remainingDays: getRemainingDays(subscription),
  };
};

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

    const { planType, paymentMethod = "razorpay" } = req.body || {};
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
      provider: "razorpay",
      status: "pending",
      verificationStatus: "unverified",
      transactionId: "",
      meta: {
        gateway: "razorpay",
        planLabel: plan.label,
      },
    });

    const order = await createRazorpayOrder({
      amount: plan.amount,
      currency: "INR",
      receipt: `sub_${String(payment._id).slice(-10)}_${Date.now().toString().slice(-8)}`,
      notes: {
        paymentId: String(payment._id),
        payerAuthId: String(payerAuthId),
        planType,
      },
    });

    payment.status = "created";
    payment.transactionId = order.id;
    payment.meta = {
      ...payment.meta,
      razorpayOrderId: order.id,
      amountInSubunits: order.amount,
      currency: order.currency,
    };
    await payment.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            _id: payment._id,
            amount: payment.amount,
            currency: order.currency,
            orderId: order.id,
            transactionId: order.id,
            planType: payment.planType,
            keyId: getRazorpayCheckoutConfig().keyId,
            gateway: "razorpay",
          },
          "Razorpay payment initiated",
        ),
      );
  } catch (error) {
    console.error("Error in createMockPaymentIntent:", error);
    const statusCode = error?.statusCode || 500;
    return res
      .status(statusCode)
      .json(new ApiError(statusCode, error.message || "Internal Server Error"));
  }
};

export const verifyAndActivateSubscription = async (req, res) => {
  try {
    const payerAuthId = req.user?._id;
    if (!payerAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const {
      paymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};
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

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res
        .status(400)
        .json(new ApiError(400, "Razorpay payment verification details are required"));
    }

    const expectedOrderId = payment.meta?.razorpayOrderId || payment.transactionId;
    if (!expectedOrderId || expectedOrderId !== razorpayOrderId) {
      payment.status = "failed";
      payment.verificationStatus = "rejected";
      payment.meta = {
        ...payment.meta,
        failureReason: "Razorpay order mismatch",
      };
      await payment.save();

      return res.status(400).json(new ApiError(400, "Razorpay order mismatch"));
    }

    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      payment.status = "failed";
      payment.verificationStatus = "rejected";
      payment.meta = {
        ...payment.meta,
        failureReason: "Invalid Razorpay signature",
      };
      await payment.save();

      return res.status(400).json(new ApiError(400, "Invalid Razorpay payment signature"));
    }

    payment.transactionId = razorpayPaymentId;
    payment.meta = {
      ...payment.meta,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      verifiedBy: "razorpay",
    };
    const activationResult = await activateSubscriptionForPayment({
      payment,
      payerAuthId,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        activationResult,
        "Subscription activated successfully",
      ),
    );
  } catch (error) {
    console.error("Error in verifyAndActivateSubscription:", error);
    const statusCode = error?.statusCode || 500;
    return res
      .status(statusCode)
      .json(new ApiError(statusCode, error.message || "Internal Server Error"));
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

    payment.status = "paid";
    payment.verificationStatus = "verified";
    payment.meta = {
      ...payment.meta,
      verifiedBy: "legacy-direct-purchase",
    };

    const activationResult = await activateSubscriptionForPayment({
      payment,
      payerAuthId,
    });

    return res.status(200).json(
      new ApiResponse(200, activationResult, "Subscription activated successfully"),
    );
  } catch (error) {
    console.error("Error in purchaseSubscription:", error);
    const statusCode = error?.statusCode || 500;
    return res
      .status(statusCode)
      .json(new ApiError(statusCode, error.message || "Internal Server Error"));
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
