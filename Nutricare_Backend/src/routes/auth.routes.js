import { Router } from "express";
import {
  Register,
  Login,
  resetPassword,
  isRegisterd,
  logout,
} from "../controllers/auth.controllers.js";
import Auth from "../middelwares/auth.middelwares.js";

const router = Router();
router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/resetpassword").post(resetPassword);
router.route("/isRegisterd").post(isRegisterd);
router.route("/logout").get(Auth, logout);
console.log("Logout route registered"); // Debug log to confirm route registration
export default router;
