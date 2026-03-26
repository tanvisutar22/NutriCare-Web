import express from "express";
import {
  assignPatientToDoctor,
  getAssignedPatients,
  removeAssignedPatient,
} from "../controllers/doctorPatient.controllers.js";
import { verifyDoctor } from "../middelwares/doctor.middelwares.js";
import verifyJWT from "../middelwares/auth.middelwares.js";

const router = express.Router();

router.use(verifyJWT, verifyDoctor);

router.post("/assign-patient", assignPatientToDoctor);
router.get("/patients", getAssignedPatients);
router.delete("/patients/:patientAuthId", removeAssignedPatient);

export default router;
