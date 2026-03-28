import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  createMockPaymentIntent,
  getMyActiveSubscription,
  getMySubscriptionHistory,
  listSubscriptionPlans,
  purchaseSubscription,
  verifyAndActivateSubscription,
} from "../controllers/subscription.controllers.js";

const subscriptionRouter = Router();

subscriptionRouter.use(Auth, authorizeRole("User"));

subscriptionRouter.get("/plans", listSubscriptionPlans);
subscriptionRouter.post("/purchase", purchaseSubscription);
subscriptionRouter.post("/payments/initiate", createMockPaymentIntent);
subscriptionRouter.post("/payments/verify", verifyAndActivateSubscription);
subscriptionRouter.get("/me", getMyActiveSubscription);
subscriptionRouter.get("/history", getMySubscriptionHistory);

export default subscriptionRouter;

