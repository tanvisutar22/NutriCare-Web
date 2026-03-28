import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  getMealLogSummary,
  listMealLogs,
  upsertMealLog,
} from "../controllers/mealLog.controllers.js";

const mealLogRouter = Router();

mealLogRouter.use(Auth, authorizeRole("User"));

mealLogRouter.get("/", listMealLogs);
mealLogRouter.get("/summary", getMealLogSummary);
mealLogRouter.post("/", upsertMealLog);

export default mealLogRouter;
