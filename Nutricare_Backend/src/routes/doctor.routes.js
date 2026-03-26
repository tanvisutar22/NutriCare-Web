import express from "express";
import { verifyDoctor } from "../middelwares/doctor.middelwares.js";
import verifyJWT from "../middelwares/auth.middelwares.js";
import {
  createDoctorProfile,
  getDoctorProfile,
} from "../controllers/doctor.controllers.js";

const router = express.Router();

router.use(verifyJWT, verifyDoctor);

router.post("/profile", createDoctorProfile);
router.get("/profile", getDoctorProfile);

export default router;
