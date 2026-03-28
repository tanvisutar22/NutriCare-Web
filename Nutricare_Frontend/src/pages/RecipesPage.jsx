import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { getApiErrorMessage } from "../shared/api/http";
import { listDietPlans, getTodayDietPlan } from "../features/diets/dietsApi";
import { getRecipeByName, getRecipeDetails } from "../features/recipes/recipesApi";

function NutritionBadge({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const extractDietRecipeNames = (diet) =>
  ["breakfast", "lunch", "dinner"].flatMap((mealKey) =>
    (diet?.meals?.[mealKey] || []).map((item) => item?.foodName).filter(Boolean),
  );

export default function RecipesPage() {
  const navigate = useNavigate();
  const [dietRecipes, setDietRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedRecipe, setSearchedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDietRecipes = async () => {
      setLoading(true);
      setError("");

      try {
        const [todayRes, dietsRes] = await Promise.allSettled([
          getTodayDietPlan(),
          listDietPlans(),
        ]);

        const todayDiet = todayRes.status === "fulfilled" ? todayRes.value?.data || null : null;
        const upcomingDiets = dietsRes.status === "fulfilled" ? dietsRes.value?.data || [] : [];
        const sourceDiet = todayDiet || upcomingDiets[0] || null;

        if (!sourceDiet) {
          if (active) setDietRecipes([]);
          return;
        }

        const names = [...new Set(extractDietRecipeNames(sourceDiet).filter(Boolean))];
        const recipeResults = await Promise.all(
          names.map(async (name) => {
            try {
              return await getRecipeDetails({ name });
            } catch {
              return null;
            }
          }),
        );

        const matchedRecipes = recipeResults
          .map((result) => result?.data || null)
          .filter(Boolean);

        if (active) {
          setDietRecipes(matchedRecipes);
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDietRecipes();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedRecipe(null);
      return;
    }

    setSearching(true);
    setError("");
    try {
      const result = await getRecipeByName(searchQuery.trim());
      setSearchedRecipe({
        foodName: result.foodName,
        calories: result.nutrition?.calories ?? null,
        protein: result.nutrition?.protein ?? null,
        carbs: result.nutrition?.carbs ?? null,
        fat: result.nutrition?.fat ?? null,
        ingredients: result.recipe?.ingredients || "",
        steps: result.recipe?.steps || "",
      });
    } catch (requestError) {
      setSearchedRecipe(null);
      setError(getApiErrorMessage(requestError));
    } finally {
      setSearching(false);
    }
  };

  const visibleRecipes = useMemo(() => {
    if (searchedRecipe) return [searchedRecipe];
    return dietRecipes;
  }, [dietRecipes, searchedRecipe]);

  const emptyTitle = searchedRecipe ? "No search result" : "No diet-linked recipes";
  const emptyDescription = searchedRecipe
    ? "Try another recipe name using the search bar."
    : "No recipe could be matched from the current diet plan, but you can still search manually.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
          Recipes
        </p>
        <h1 className="section-title mt-2">Recipes from your current diet plan first</h1>
        <p className="section-copy">
          The page now defaults to recipes tied to your active diet plan. Search only when you want a different recipe.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card">
          <h2 className="text-lg font-semibold text-slate-900">Find another recipe</h2>
          <form className="mt-4 flex gap-3" onSubmit={handleSearch}>
            <input
              className="input"
              placeholder="Search recipe by name"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button className="btn-primary" type="submit">
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            {searchedRecipe
              ? `Showing search result for "${searchedRecipe.foodName}".`
              : "Showing recipe ideas based on your active diet plan."}
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <div className="card text-sm text-slate-500">Loading recipes...</div>
          ) : visibleRecipes.length === 0 ? (
            <div className="card">
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </div>
          ) : (
            visibleRecipes.map((recipe, index) => (
              <article key={`${recipe.foodName}-${index}`} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {searchedRecipe ? "Search result" : "Current diet recipe"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{recipe.foodName}</h2>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      navigate(`/meal-details?name=${encodeURIComponent(recipe.foodName)}`, {
                        state: { recipeName: recipe.foodName },
                      })
                    }
                  >
                    Open full recipe
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <NutritionBadge label="Calories" value={recipe.calories != null ? `${recipe.calories} kcal` : "Not available"} />
                  <NutritionBadge label="Protein" value={recipe.protein != null ? `${recipe.protein}g` : "Not available"} />
                  <NutritionBadge label="Carbs" value={recipe.carbs != null ? `${recipe.carbs}g` : "Not available"} />
                  <NutritionBadge label="Fat" value={recipe.fat != null ? `${recipe.fat}g` : "Not available"} />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Ingredients</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {recipe.ingredients || "No ingredients provided."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">Steps</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {recipe.steps || "No steps provided."}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
