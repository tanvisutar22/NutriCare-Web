import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_FOOD_CSV_PATHS = [
  // Preferred location
  path.resolve(__dirname, "..", "..", "data", "food.csv"),
  // Common alternative (you currently have this)
  path.resolve(__dirname, "..", "data", "food.csv"),
];

const resolveFoodCsvPath = async () => {
  const envPath = process.env.FOOD_CSV_PATH?.trim();
  const candidates = envPath
    ? [path.resolve(envPath), ...DEFAULT_FOOD_CSV_PATHS]
    : DEFAULT_FOOD_CSV_PATHS;

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }

  // Return the preferred default for error messaging
  return candidates[0];
};

let cachedFoods = null;

const parseCsvLine = (line) => {
  // simple split by comma; assumes no commas inside fields
  return line.split(",").map((value) => value.trim());
};

const loadFoodData = async () => {
  if (cachedFoods) return cachedFoods;

  try {
    const foodCsvPath = await resolveFoodCsvPath();
    const raw = await fs.readFile(foodCsvPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      cachedFoods = [];
      return cachedFoods;
    }

    const header = parseCsvLine(lines[0]);
    const idx = {
      foodName: header.indexOf("foodName"),
      category: header.indexOf("category"),
      calories: header.indexOf("calories"),
      protein: header.indexOf("protein"),
      carbs: header.indexOf("carbs"),
      fat: header.indexOf("fat"),
      foodPreference: header.indexOf("foodPreference"),
      allergens: header.indexOf("allergens"),
      medicalTags: header.indexOf("medicalTags"),
    };

    cachedFoods = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const get = (key) =>
        idx[key] >= 0 && idx[key] < cols.length ? cols[idx[key]] : "";

      const allergensRaw = get("allergens");
      const medicalTagsRaw = get("medicalTags");

      return {
        foodName: get("foodName"),
        category: get("category") || "any",
        calories: Number(get("calories")) || 0,
        protein: Number(get("protein")) || 0,
        carbs: Number(get("carbs")) || 0,
        fat: Number(get("fat")) || 0,
        foodPreference: get("foodPreference") || "veg",
        allergens: allergensRaw
          ? allergensRaw
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        medicalTags: medicalTagsRaw
          ? medicalTagsRaw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
    });
    // console.log(cachedFoods);
    console.log("Food data loaded successfully");
    return cachedFoods;
  } catch (error) {
    console.error("Error loading food.csv:", error);
    cachedFoods = [];
    return cachedFoods;
  }
};

const filterFoodsForUser = (foods, user) => {
  const toStringList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.flat().map((v) => String(v));
    return [String(value)];
  };

  const norm = (value) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const preferenceList = toStringList(user.foodPreference)
    .map(norm)
    .filter(Boolean);
  const preference = preferenceList[0] || null;

  const allergies = toStringList(user.allergies).map(norm).filter(Boolean);
  const medicalConditions = toStringList(user.medicalConditions)
    .map(norm)
    .filter(Boolean);

  return foods.filter((food) => {
    // console.log("Food:", food);
    const foodPreference = food.foodPreference ? norm(food.foodPreference) : null;
    const foodAllergens = Array.isArray(food.allergens)
      ? food.allergens.map(norm).filter(Boolean)
      : [];
    const foodMedicalTags = Array.isArray(food.medicalTags)
      ? food.medicalTags.map(norm).filter(Boolean)
      : [];

    if (preference && foodPreference && foodPreference !== preference)
      return false;

    if (
      allergies.length > 0 &&
      foodAllergens.some((a) => allergies.includes(a))
    ) {
      return false;
    }

    if (medicalConditions.length > 0 && foodMedicalTags.length > 0) {
      const conditionKeywords = medicalConditions.map((c) => `${c}_safe`);
      const matchesCondition = conditionKeywords.some((kw) =>
        foodMedicalTags.includes(norm(kw)),
      );
      if (!matchesCondition) return false;
    }

    return true;
  });
};

const pickFoodsForMeal = (foods, targetCals) => {
  const sorted = [...foods].sort((a, b) => a.calories - b.calories);
  const result = [];
  let total = 0;

  for (const food of sorted) {
    if (food.calories <= 0) continue;
    if (total + food.calories > targetCals * 1.2) break;
    result.push(food);
    total += food.calories;
    if (total >= targetCals * 0.9) break;
  }

  if (result.length === 0 && sorted.length > 0) {
    result.push(sorted[0]);
  }

  return result;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const sumTotals = (foods) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const f of foods) {
    totals.calories += Number(f.calories) || 0;
    totals.protein += Number(f.protein) || 0;
    totals.carbs += Number(f.carbs) || 0;
    totals.fat += Number(f.fat) || 0;
  }
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
};

const toMealFoodDocs = (picked) =>
  picked.map((f) => ({
    foodName: f.foodName,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
  }));

const preferMealCategory = (foods, mealName) => {
  const normalizedMeal = String(mealName).toLowerCase();
  const inCategory = foods.filter((f) => {
    const c = String(f.category || "").toLowerCase();
    return c === normalizedMeal || c === "any" || c === "";
  });
  return inCategory.length ? inCategory : foods;
};

const pickFoodsAvoidingRepeats = (foods, targetCals, usedNames, maxOverlap) => {
  const available = foods.filter((f) => !usedNames.has(f.foodName));
  let picked = pickFoodsForMeal(available, targetCals);

  if (picked.length === 0) {
    picked = pickFoodsForMeal(foods, targetCals);
  }

  let overlapCount = picked.filter((f) => usedNames.has(f.foodName)).length;
  if (overlapCount > maxOverlap) {
    const noOverlap = picked.filter((f) => !usedNames.has(f.foodName));
    if (noOverlap.length) picked = noOverlap;
    overlapCount = picked.filter((f) => usedNames.has(f.foodName)).length;
  }

  for (const f of picked) usedNames.add(f.foodName);
  return picked;
};

const buildMealGoals = (targets, mealShare) => {
  const mk = (share) => ({
    calories: Math.round(targets.calorieTarget * share),
    protein: Math.round(targets.proteinTarget * share),
    carbs: Math.round(targets.carbTarget * share),
    fat: Math.round(targets.fatTarget * share),
  });

  return {
    breakfast: mk(mealShare.breakfast),
    lunch: mk(mealShare.lunch),
    dinner: mk(mealShare.dinner),
  };
};

export const buildMealsFromFoodCsv = async (
  user,
  targets,
  optionsCount = { breakfast: 5, lunch: 7, dinner: 7 },
  maxFoodsPerOption = 4,
) => {
  const foods = await loadFoodData();
  if (!foods || foods.length === 0) {
    return null;
  }

  let userFoods = filterFoodsForUser(foods, user);
  if (!userFoods.length) {
    console.warn(
      "No foods matched user filters. Falling back to full food list.",
      {
        userFoodPreference: user.foodPreference,
        userAllergies: user.allergies,
        userMedicalConditions: user.medicalConditions,
      },
    );
    userFoods = foods;
  }

  const mealShare = {
    breakfast: 0.25,
    lunch: 0.4,
    dinner: 0.35,
  };

  const mealGoals = buildMealGoals(targets, mealShare);

  // Default meals (selected) try to avoid repetition across meals
  const usedNames = new Set();
  const breakfastPool = preferMealCategory(userFoods, "breakfast");
  const lunchPool = preferMealCategory(userFoods, "lunch");
  const dinnerPool = preferMealCategory(userFoods, "dinner");

  const breakfastPicked = pickFoodsAvoidingRepeats(
    breakfastPool,
    mealGoals.breakfast.calories,
    usedNames,
    0,
  );
  const lunchPicked = pickFoodsAvoidingRepeats(
    lunchPool,
    mealGoals.lunch.calories,
    usedNames,
    1, // allow 1 overlap total if needed
  );
  const dinnerPicked = pickFoodsAvoidingRepeats(
    dinnerPool,
    mealGoals.dinner.calories,
    usedNames,
    1,
  );

  const meals = {
    breakfast: toMealFoodDocs(breakfastPicked),
    lunch: toMealFoodDocs(lunchPicked),
    dinner: toMealFoodDocs(dinnerPicked),
  };

  // Options: 3–4 alternatives per meal (repetition allowed but naturally reduced by category & ordering)
  const buildOptions = (mealName, pool, goalCalories, count) => {
    const opts = [];
    const desired = Math.max(1, Number(count) || 1);

    for (let i = 0; i < desired; i++) {
      const randomized = shuffle(pool);
      const picked = pickFoodsForMeal(randomized, goalCalories).slice(
        0,
        maxFoodsPerOption,
      );
      const foodsDocs = toMealFoodDocs(picked);
      opts.push({ foods: foodsDocs, totals: sumTotals(foodsDocs) });
    }

    return opts.slice(0, desired);
  };

  const mealOptions = {
    breakfast: buildOptions(
      "breakfast",
      breakfastPool,
      mealGoals.breakfast.calories,
      optionsCount.breakfast,
    ),
    lunch: buildOptions("lunch", lunchPool, mealGoals.lunch.calories, optionsCount.lunch),
    dinner: buildOptions(
      "dinner",
      dinnerPool,
      mealGoals.dinner.calories,
      optionsCount.dinner,
    ),
  };

  return { meals, mealGoals, mealOptions };
};

