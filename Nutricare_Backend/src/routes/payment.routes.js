import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";

const router = Router();

router.use(Auth, authorizeRole("User"));

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

export default router;
