import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import Card from "../components/Card";
import Loader from "../components/ui/Loader";
import { getApiErrorMessage } from "../shared/api/http";
import { getRecipeDetails } from "../features/recipes/recipesApi";
import {
  formatIngredients,
  formatSteps,
  hasNutrition,
} from "../features/recipes/recipeFormatters";

function NutritionItem({ label, value, unit = "" }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">
        {value ?? "NA"}{value != null ? unit : ""}
      </p>
    </div>
  );
}

export default function MealDetails() {
  const location = useLocation();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const recipeName = location.state?.recipeName || query.get("name") || "";
  const recipeId = location.state?.recipeId || query.get("id") || "";

  useEffect(() => {
    const load = async () => {
      if (!recipeName && !recipeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await getRecipeDetails({
          ...(recipeId ? { id: recipeId } : {}),
          ...(recipeName ? { name: recipeName } : {}),
        });
        setRecipe(res?.data || null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [recipeId, recipeName]);

  const ingredients = useMemo(() => formatIngredients(recipe?.ingredients), [recipe]);
  const steps = useMemo(() => formatSteps(recipe?.steps), [recipe]);

  return (
    <MainLayout title="Smart Meal Preparation Details">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/recipes"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            Back to Smart Meal Preparation
          </Link>
        </div>

        {loading ? <Loader label="Loading smart meal details..." /> : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && !recipe ? (
          <Card title="Smart Meal Preparation Details" subtitle="Meal data could not be loaded">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Select a smart meal from the Smart Meal Preparation page to view full details.
            </div>
          </Card>
        ) : null}

        {!loading && !error && recipe ? (
          <>
            <Card className="bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(255,255,255,0.96),rgba(16,185,129,0.10))]">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
                    Smart Meal Preparation
                  </p>
                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                    {recipe.foodName || "Smart Meal Preparation Details"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Cleanly formatted ingredients and preparation steps, even when
                    the dataset provides plain strings instead of arrays.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Ready to cook</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Structured like a smart meal planner
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Card title="Ingredients" subtitle="What you need">
                {ingredients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Detailed ingredients not available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                      <div
                        key={`${ingredient}-${index}`}
                        className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span className="mt-0.5 text-emerald-600">☐</span>
                        <span className="text-sm leading-6 text-slate-700">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Method" subtitle="Step-by-step instructions">
                {steps.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Detailed preparation steps not available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Step {index + 1}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {hasNutrition(recipe) ? (
              <Card title="Nutrition" subtitle="Per serving or available recipe data">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <NutritionItem label="Calories" value={recipe.calories} unit=" kcal" />
                  <NutritionItem label="Protein" value={recipe.protein} unit=" g" />
                  <NutritionItem label="Carbs" value={recipe.carbs} unit=" g" />
                  <NutritionItem label="Fat" value={recipe.fat} unit=" g" />
                </div>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}
