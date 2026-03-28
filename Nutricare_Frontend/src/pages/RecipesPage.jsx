import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import { getFoods, getRecipeByName } from "../features/recipes/recipesApi";

function NutritionBadge({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function RecipesPage() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [foodQuery, setFoodQuery] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [category, setCategory] = useState("");
  const [start, setStart] = useState(0);
  const [foodMeta, setFoodMeta] = useState({ total: 0, hasMore: false });
  const [recipe, setRecipe] = useState(null);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [error, setError] = useState("");

  async function loadFoods(nextStart = 0) {
    setLoadingFoods(true);
    setError("");

    try {
      const response = await getFoods({
        start: nextStart,
        limit: 12,
        category: category || undefined,
        search: foodQuery || undefined,
      });

      const payload = response?.data || {};
      setFoods(Array.isArray(payload.data) ? payload.data : []);
      setFoodMeta({
        total: payload.total || 0,
        hasMore: Boolean(payload.hasMore),
      });
      setStart(payload.start || 0);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoadingFoods(false);
    }
  }

  useEffect(() => {
    loadFoods(0);
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(foods.map((item) => item.category).filter(Boolean)));
  }, [foods]);

  const handleRecipeSearch = async (event) => {
    event.preventDefault();
    if (!recipeQuery.trim()) return;

    setLoadingRecipe(true);
    setError("");

    try {
      const result = await getRecipeByName(recipeQuery.trim());
      setRecipe(result);
    } catch (recipeError) {
      setRecipe(null);
      setError(getApiErrorMessage(recipeError));
    } finally {
      setLoadingRecipe(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            Foods and Recipes
          </p>
          <h1 className="section-title mt-2">Explore meals that fit your profile</h1>
          <p className="section-copy">
            Foods are filtered by backend rules using your saved food preference,
            allergies, and medical conditions.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="card">
            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_auto]">
              <input
                className="input"
                placeholder="Search foods by name"
                value={foodQuery}
                onChange={(event) => setFoodQuery(event.target.value)}
              />
              <select
                className="input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => loadFoods(0)}>
                Search
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <p>{foodMeta.total} filtered foods available</p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  disabled={start === 0}
                  onClick={() => loadFoods(Math.max(0, start - 12))}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  disabled={!foodMeta.hasMore}
                  onClick={() => loadFoods(start + 12)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loadingFoods ? (
              <div className="card text-sm text-slate-500">Loading foods...</div>
            ) : foods.length === 0 ? (
              <div className="card text-sm text-slate-500">No foods found.</div>
            ) : (
              foods.map((food, index) => (
                <article key={`${food.foodName}-${index}`} className="card">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {food.category || "any"}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    {food.foodName}
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <NutritionBadge label="Calories" value={`${food.calories} kcal`} />
                    <NutritionBadge label="Protein" value={`${food.protein}g`} />
                    <NutritionBadge label="Carbs" value={`${food.carbs}g`} />
                    <NutritionBadge label="Fat" value={`${food.fat}g`} />
                  </div>
                  <button
                    className="btn-secondary mt-4 w-full"
                    onClick={() => {
                      navigate(`/meal-details?name=${encodeURIComponent(food.foodName)}`, {
                        state: { recipeName: food.foodName },
                      });
                    }}
                  >
                    View recipe
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Recipe explorer</h2>
            <form className="mt-4 flex gap-3" onSubmit={handleRecipeSearch}>
              <input
                className="input"
                placeholder="Search recipe by exact or partial name"
                value={recipeQuery}
                onChange={(event) => setRecipeQuery(event.target.value)}
              />
              <button className="btn-primary" type="submit">
                Search
              </button>
            </form>
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="card">
            {loadingRecipe ? (
              <p className="text-sm text-slate-500">Loading recipe...</p>
            ) : !recipe ? (
              <div className="space-y-3 text-sm text-slate-500">
                <p>Search a recipe to see ingredients, steps, and nutrition.</p>
                <div className="rounded-2xl border border-dashed border-slate-200 p-4">
                  Future slot: AI cooking helper and meal swaps.
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Recipe result
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {recipe.foodName}
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <NutritionBadge
                    label="Calories"
                    value={
                      recipe.nutrition?.calories
                        ? `${recipe.nutrition.calories} kcal`
                        : "Not available"
                    }
                  />
                  <NutritionBadge
                    label="Protein"
                    value={
                      recipe.nutrition?.protein
                        ? `${recipe.nutrition.protein}g`
                        : "Not available"
                    }
                  />
                  <NutritionBadge
                    label="Carbs"
                    value={
                      recipe.nutrition?.carbs
                        ? `${recipe.nutrition.carbs}g`
                        : "Not available"
                    }
                  />
                  <NutritionBadge
                    label="Fat"
                    value={
                      recipe.nutrition?.fat
                        ? `${recipe.nutrition.fat}g`
                        : "Not available"
                    }
                  />
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Ingredients</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {recipe.recipe?.ingredients || "No ingredients provided."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Steps</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {recipe.recipe?.steps || "No steps provided."}
                    </p>
                  </div>
                  <button
                    className="btn-primary w-full"
                    onClick={() =>
                      navigate(`/meal-details?name=${encodeURIComponent(recipe.foodName)}`, {
                        state: { recipeName: recipe.foodName },
                      })
                    }
                  >
                    Open full recipe page
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
