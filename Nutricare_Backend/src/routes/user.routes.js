import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import {
  bookDoctorForUser,
  createUserProfile,
  getMyAssignedDoctor,
  getMyProfile,
  getMyDoctorNotes,
  listApprovedDoctorsForUsers,
  updateMyProfile,
} from "../controllers/user.controllers.js";

const userRouter = Router();

// All user profile routes require authenticated normal user
userRouter.use(Auth, authorizeRole("User"));

userRouter.route("/me").get(getMyProfile).put(updateMyProfile);
userRouter.route("/notes").get(getMyDoctorNotes);
userRouter.route("/doctors").get(listApprovedDoctorsForUsers);
userRouter.route("/my-doctor").get(getMyAssignedDoctor).post(bookDoctorForUser);
userRouter.route("/").post(createUserProfile);

export default userRouter;

