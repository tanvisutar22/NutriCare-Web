import express from "express";
import {
  getDoctorDashboardSummary,
  getPatientFullDetails,
  getDoctorWallet,
} from "../controllers/doctorDashboard.controllers.js";
import {
  createDoctorNote,
  getDoctorPatientNotes,
} from "../controllers/doctorNote.controllers.js";
import {
  commitReviewRequest,
  listMyReviewRequests,
} from "../controllers/doctorReviewRequest.controllers.js";
import { verifyDoctor } from "../middelwares/doctor.middelwares.js";
import { verifyApprovedDoctor } from "../middelwares/approvedDoctor.middelwares.js";
import verifyJWT from "../middelwares/auth.middelwares.js";

const router = express.Router();

router.use(verifyJWT, verifyDoctor, verifyApprovedDoctor);

router.get("/dashboard", getDoctorDashboardSummary);
router.get("/wallet", getDoctorWallet);
router.get("/patients/:patientAuthId/details", getPatientFullDetails);

router.post("/notes", createDoctorNote);
router.get("/notes/:patientAuthId", getDoctorPatientNotes);

router.get("/review-requests", listMyReviewRequests);
router.post("/review-requests/:requestId/commit", commitReviewRequest);

export default router;
