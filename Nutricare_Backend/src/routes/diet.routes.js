import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  createDietPlan,
  listDietPlans,
  getDietPlanById,
  updateDietPlanStatus,
  getTodayDietPlan,
  getWeeklyDietPlan
} from "../controllers/diet.controllers.js";

const dietRouter = Router();

dietRouter.use(Auth, authorizeRole("User"));

dietRouter.route("/").get(listDietPlans).post(createDietPlan);
dietRouter.route("/today").get(getTodayDietPlan);
dietRouter.route("/weekly").get(getWeeklyDietPlan);
dietRouter.route("/:id").get(getDietPlanById).patch(updateDietPlanStatus);



export default dietRouter;

