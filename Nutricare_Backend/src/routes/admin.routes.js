import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { verifyAdmin } from "../middelwares/admin.middelwares.js";
import {
  getAdminWalletOverview,
  listDoctorsForAdmin,
  setDoctorApproval,
  computeMonthlyPayouts,
  initiateDoctorPayoutPayment,
  payDoctorMonthlyPayout,
  verifyDoctorPayoutPayment,
} from "../controllers/admin.controllers.js";

const adminRouter = Router();

adminRouter.use(Auth, verifyAdmin);

adminRouter.get("/doctors", listDoctorsForAdmin);
adminRouter.patch("/doctors/:doctorAuthId/approval", setDoctorApproval);
adminRouter.get("/wallet", getAdminWalletOverview);
adminRouter.get("/payouts", computeMonthlyPayouts);
adminRouter.post("/payouts/:doctorAuthId/initiate-payment", initiateDoctorPayoutPayment);
adminRouter.post("/payouts/:doctorAuthId/verify-payment", verifyDoctorPayoutPayment);
adminRouter.post("/payouts/:doctorAuthId/pay", payDoctorMonthlyPayout);

export default adminRouter;

