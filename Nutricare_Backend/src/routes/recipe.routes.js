import { Router } from "express";
import Auth from "../middelwares/auth.middelwares.js";
import { authorizeRole } from "../middelwares/authorizeRole.middelwares.js";
import { getFoods, getRecipeByName} from "../controllers/recipe.controllers.js";
const recipeRouter = Router();

recipeRouter.use(Auth, authorizeRole("User"));
recipeRouter.route("/foods").get(getFoods);
recipeRouter.route("/recipeByName").get(getRecipeByName);
export default recipeRouter;