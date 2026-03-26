import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  getMyActiveSubscription,
  purchaseSubscription,
} from "../controllers/subscription.controllers.js";

const subscriptionRouter = Router();

subscriptionRouter.use(Auth, authorizeRole("User"));

subscriptionRouter.post("/purchase", purchaseSubscription);
subscriptionRouter.get("/me", getMyActiveSubscription);

export default subscriptionRouter;

