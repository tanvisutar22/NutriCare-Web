import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
     getStreakData,
    getWeightData,
    getHealthRisk,
    getIntakeAndActivity
} from "../controllers/dashboard.controllers.js";
const dashboardRouter = Router();
dashboardRouter.use(Auth, authorizeRole("User"));
dashboardRouter.route("/streak").get(getStreakData);
dashboardRouter.route("/weight").get(getWeightData);
dashboardRouter.route("/health-risk").get(getHealthRisk);
dashboardRouter.route("/intake-activity").get(getIntakeAndActivity);
export default dashboardRouter;