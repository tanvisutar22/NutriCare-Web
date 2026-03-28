import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { loadFoodData, filterFoodsForUser } from "../utils/foodSelector.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RECIPE_CSV_PATHS = [
  path.resolve(__dirname, "..", "..", "data", "nutricare_recipes_detailed.csv"),
  path.resolve(__dirname, "..", "..", "data", "recipe.csv"),
  path.resolve(__dirname, "..", "data", "recipe.csv"),
];

const resolveRecipeCsvPath = async () => {
  const envPath = process.env.RECIPE_CSV_PATH?.trim();
  const candidates = envPath
    ? [path.resolve(envPath), ...DEFAULT_RECIPE_CSV_PATHS]
    : DEFAULT_RECIPE_CSV_PATHS;

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  return candidates[0];
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

let cachedRecipes = null;

export const loadRecipeData = async () => {
  if (cachedRecipes) return cachedRecipes;

  try {
    const filePath = await resolveRecipeCsvPath();
    const raw = await fs.readFile(filePath, "utf-8");
    const lines = raw.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length <= 1) {
      cachedRecipes = [];
      return cachedRecipes;
    }

    const header = parseCsvLine(lines[0]);
    const indexMap = {
      id: header.indexOf("id"),
      foodName: header.indexOf("Food Name"),
      ingredients: header.indexOf("Ingredients"),
      steps: header.indexOf("Steps"),
    };

    cachedRecipes = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const get = (key) =>
        indexMap[key] >= 0 && indexMap[key] < cols.length ? cols[indexMap[key]] : "";

      return {
        id: get("id"),
        foodName: get("foodName"),
        Ingredients: get("ingredients"),
        Steps: get("steps"),
      };
    });

    return cachedRecipes;
  } catch (error) {
    console.error("Error loading recipe data:", error);
    cachedRecipes = [];
    return cachedRecipes;
  }
};

const normalizeRecipePayload = (recipe, food) => ({
  id: recipe?.id || null,
  foodName: food?.foodName || recipe?.foodName || "",
  ingredients: recipe?.Ingredients || recipe?.ingredients || "",
  steps: recipe?.Steps || recipe?.steps || "",
  calories: food ? Number(food.calories) || 0 : null,
  protein: food ? Number(food.protein) || 0 : null,
  carbs: food ? Number(food.carbs) || 0 : null,
  fat: food ? Number(food.fat) || 0 : null,
});

const normalize = (value) => String(value || "").trim().toLowerCase();

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
    let filteredFoods = filterFoodsForUser(foods, user);

    if (category) {
      filteredFoods = filteredFoods.filter(
        (food) => food.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    if (search) {
      filteredFoods = filteredFoods.filter((food) =>
        food.foodName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    filteredFoods = filteredFoods.sort(() => Math.random() - 0.5);
    const paginated = filteredFoods.slice(start, start + limit);

    return res.json(
      new ApiResponse(200, {
        start,
        limit,
        total: filteredFoods.length,
        hasMore: start + limit < filteredFoods.length,
        data: paginated,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Error fetching foods"));
  }
};

const getRecipeByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const recipes = await loadRecipeData();
    const foods = await loadFoodData();

    const recipe = recipes.find((row) => normalize(row.foodName).includes(normalize(name)));
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const food = foods.find((row) => normalize(row.foodName).includes(normalize(name)));
    const payload = normalizeRecipePayload(recipe, food);

    return res.json({
      foodName: payload.foodName,
      nutrition: food
        ? {
            calories: payload.calories,
            protein: payload.protein,
            carbs: payload.carbs,
            fat: payload.fat,
          }
        : null,
      recipe: {
        ingredients: payload.ingredients,
        steps: payload.steps,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching recipe" });
  }
};

const getRecipeDetails = async (req, res) => {
  try {
    const { id, name } = req.query;

    if (!id && !name) {
      return res.status(400).json(new ApiError(400, "Recipe id or name is required"));
    }

    const recipes = await loadRecipeData();
    const foods = await loadFoodData();

    const recipe = recipes.find((row) => {
      if (id && String(row.id) === String(id)) return true;
      if (name && normalize(row.foodName).includes(normalize(name))) return true;
      return false;
    });

    if (!recipe) {
      return res.status(404).json(new ApiError(404, "Recipe not found"));
    }

    const food = foods.find((row) =>
      normalize(row.foodName).includes(normalize(recipe.foodName || name)),
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          normalizeRecipePayload(recipe, food),
          "Recipe details fetched successfully",
        ),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Error fetching recipe details"));
  }
};

export { getFoods, getRecipeByName, getRecipeDetails };
