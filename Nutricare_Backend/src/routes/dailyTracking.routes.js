import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  getTodayTracking,
  getTrackingStatus,
  upsertDailyTracking,
} from "../controllers/dailyTracking.controller.js";

const router = Router();

router.use(Auth, authorizeRole("User"));

router.get("/today", getTodayTracking);
router.put("/today", upsertDailyTracking);
router.get("/status", getTrackingStatus);

export default router;
