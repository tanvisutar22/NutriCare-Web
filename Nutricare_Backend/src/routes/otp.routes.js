import { sendOtp, verifyOtp } from "../controllers/otp.controllers.js";
import { Router } from "express";

const otpRouter = Router();

console.log("abhi");
otpRouter.route("/sendOtp").post(sendOtp);
otpRouter.route("/verifyOtp").post(verifyOtp);

export default otpRouter;
