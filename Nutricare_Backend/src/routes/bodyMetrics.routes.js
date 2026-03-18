import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  createBodyMetric,
  listBodyMetrics,
  getBodyMetricById,
  updateBodyMetric,
  deleteBodyMetric,
} from "../controllers/bodyMetrics.controllers.js";

const bodyMetricsRouter = Router();

// Protect all routes; only normal users can manage their own metrics
bodyMetricsRouter.use(Auth, authorizeRole("User"));

bodyMetricsRouter.route("/").get(listBodyMetrics).post(createBodyMetric);
bodyMetricsRouter
  .route("/:id")
  .get(getBodyMetricById)
  .put(updateBodyMetric)
  .delete(deleteBodyMetric);

export default bodyMetricsRouter;

