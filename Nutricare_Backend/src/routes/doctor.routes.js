import express from "express";
import { verifyDoctor } from "../middelwares/doctor.middelwares.js";
import {
  createDoctorProfile,
  getDoctorProfile,
} from "../controllers/doctor.controllers.js";

const router = express.Router();

router.post("/profile", verifyDoctor, createDoctorProfile);
router.get("/profile", verifyDoctor, getDoctorProfile);

export default router;
