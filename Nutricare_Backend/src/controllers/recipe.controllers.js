import {loadFoodData} from "../utils/foodSelector.js";
import User from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import{filterFoodsForUser} from "../utils/foodSelector.js";
 const getFoods = async (req, res) => {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const start = Number(req.query.start) || 0;
    const limit = Number(req.query.limit) || 10;

    const { category, search } = req.query;

    const user = await User.findOne({ authId });
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    const foods = await loadFoodData();
    console.log(`Total foods loaded: ${foods.length}`);
    // ✅ user-based filtering
    let filteredFoods = filterFoodsForUser(foods, user);
      console.log(`Foods after user filtering: ${filteredFoods.length}`);
      console.log(`Sample food after filtering: ${filteredFoods[0] ? filteredFoods[0].foodName : "No foods"}`);
    // ✅ optional filters
    if (category) {
      filteredFoods = filteredFoods.filter(
        f => f.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      filteredFoods = filteredFoods.filter(f =>
        f.foodName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ✅ random order
    filteredFoods = filteredFoods.sort(() => Math.random() - 0.5);

    // ✅ pagination
    const paginated = filteredFoods.slice(start, start + limit);

    return res.json(new ApiResponse(200, {    
      start,
      limit,
      total: filteredFoods.length,
      hasMore: start + limit < filteredFoods.length,
      data: paginated
    }));

  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiError(500, "Error fetching foods"));
  }
};
 const getRecipeByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const norm = (v) =>
      String(v).trim().toLowerCase();

    // ✅ Load data
    const recipes = await loadRecipeData();
    const foods = await loadFoodData();

    // ✅ Find recipe by name (flexible match)
    const recipe = recipes.find(r =>
      norm(r.foodName).includes(norm(name))
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // ✅ Find food using SAME NAME
    const food = foods.find(f =>
      norm(f.foodName).includes(norm(name))
    );

    return res.json({
      foodName: food?.foodName || recipe.foodName,

      // ✅ Nutrition
      nutrition: food
        ? {
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat
          }
        : null,

      // ✅ Recipe
      recipe: {
        ingredients: recipe.Ingredients,
        steps: recipe.Steps
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching recipe" });
  }
};
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ possible paths
const DEFAULT_RECIPE_CSV_PATHS = [
  path.resolve(__dirname, "..", "..", "data", "recipe.csv"),
  path.resolve(__dirname, "..", "data", "recipe.csv"),
];

const resolveRecipeCsvPath = async () => {
  const envPath = process.env.RECIPE_CSV_PATH?.trim();

  const candidates = envPath
    ? [path.resolve(envPath), ...DEFAULT_RECIPE_CSV_PATHS]
    : DEFAULT_RECIPE_CSV_PATHS;

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }

  return candidates[0];
};

// ✅ cache
let cachedRecipes = null;

// ✅ simple parser
const parseCsvLine = (line) => {
  return line.split(",").map(v => v.trim());
};

// 🚀 MAIN FUNCTION
export const loadRecipeData = async () => {
  if (cachedRecipes) return cachedRecipes;

  try {
    const filePath = await resolveRecipeCsvPath();
    const raw = await fs.readFile(filePath, "utf-8");

    const lines = raw.split(/\r?\n/).filter(l => l.trim());

    if (lines.length <= 1) {
      cachedRecipes = [];
      return cachedRecipes;
    }

    const header = parseCsvLine(lines[0]);

    // ✅ dynamic index mapping (IMPORTANT)
    const idx = {
      id: header.indexOf("id"),
      foodName: header.indexOf("Food Name"),
      ingredients: header.indexOf("Ingredients"),
      steps: header.indexOf("Steps"),
    };

    cachedRecipes = lines.slice(1).map(line => {
      const cols = parseCsvLine(line);

      const get = (key) =>
        idx[key] >= 0 && idx[key] < cols.length ? cols[idx[key]] : "";

      return {
        id: get("id"),
        foodName: get("foodName"),
        Ingredients: get("ingredients"),
        Steps: get("steps"),
      };
    });

    console.log("Recipe data loaded successfully");
    return cachedRecipes;

  } catch (error) {
    console.error("Error loading recipe.csv:", error);
    cachedRecipes = [];
    return cachedRecipes;
  }
};
export {getFoods,getRecipeByName};