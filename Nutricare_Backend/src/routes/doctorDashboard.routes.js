import express from "express";
import {
  getDoctorDashboardSummary,
  getPatientFullDetails,
} from "../controllers/doctorDashboard.controllers.js";
import {
  createDoctorNote,
  getDoctorPatientNotes,
} from "../controllers/doctorNote.controllers.js";
import { verifyDoctor } from "../middelwares/doctor.middelwares.js";
import verifyJWT from "../middelwares/auth.middelwares.js";

const router = express.Router();

router.use(verifyJWT, verifyDoctor);

router.get("/dashboard", getDoctorDashboardSummary);
router.get("/patients/:patientAuthId/details", getPatientFullDetails);

router.post("/notes", createDoctorNote);
router.get("/notes/:patientAuthId", getDoctorPatientNotes);

export default router;
