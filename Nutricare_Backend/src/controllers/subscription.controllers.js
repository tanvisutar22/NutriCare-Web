import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";

const normalizeStartOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const durationDaysForPlan = (planType) => (planType === "monthly" ? 30 : 7);

export const purchaseSubscription = async (req, res) => {
  try {
    const patientAuthId = req.user?._id;
    if (!patientAuthId) {
      return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    const { planType, amount, startDate } = req.body || {};

    if (!planType || !["weekly", "monthly"].includes(planType)) {
      return res
        .status(400)
        .json(new ApiError(400, "planType must be weekly or monthly"));
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res
        .status(400)
        .json(new ApiError(400, "amount must be a valid number"));
    }

    const start = normalizeStartOfDay(startDate ? new Date(startDate) : new Date());
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json(new ApiError(400, "Invalid startDate"));
    }

    const days = durationDaysForPlan(planType);
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    end.setHours(23, 59, 59, 999);

    const payment = await Payment.create({
      payerAuthId: patientAuthId,
      planType,
      amount: parsedAmount,
      status: "paid",
      provider: "mock",
      meta: { note: "Mock payment (no gateway)" },
    });

    const subscription = await Subscription.create({
      patientAuthId,
      planType,
      startDate: start,
      endDate: end,
      status: "active",
      paymentId: payment._id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { subscription, payment },
          "Subscription purchased successfully",
        ),
      );
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

    const now = new Date();
    const subscription = await Subscription.findOne({
      patientAuthId,
      status: "active",
      endDate: { $gte: now },
    }).sort({ endDate: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, subscription, "Subscription fetched"));
  } catch (error) {
    console.error("Error in getMyActiveSubscription:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

