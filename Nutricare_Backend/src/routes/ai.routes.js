import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import { userLogs,dietChatbotUtility } from "../controllers/ai.controllers.js";
const aiRouter = Router();
aiRouter.use(Auth, authorizeRole("User"));
aiRouter.route("/logs").post(userLogs);
aiRouter.route("/chat").post(dietChatbotUtility);
export default aiRouter;