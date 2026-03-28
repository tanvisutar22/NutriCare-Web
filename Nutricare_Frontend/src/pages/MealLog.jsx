import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  getMealLogSummary,
  listMealLogs,
  saveMealLog,
} from "../features/mealLogs/mealLogsApi";

const EMPTY_FOOD = { name: "", quantity: "", unit: "" };

export default function MealLog() {
  const [mealType, setMealType] = useState("breakfast");
  const [foods, setFoods] = useState([{ ...EMPTY_FOOD }]);
  const [nutrition, setNutrition] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summary, setSummary] = useState({ totals: {}, rows: [] });
  const [recentLogs, setRecentLogs] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, logsRes] = await Promise.all([
        getMealLogSummary(),
        listMealLogs({ from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }),
      ]);
      setSummary(summaryRes?.data || { totals: {}, rows: [] });
      setRecentLogs(Array.isArray(logsRes?.data) ? logsRes.data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateFood = (index, field, value) => {
    setFoods((current) =>
      current.map((food, foodIndex) =>
        foodIndex === index ? { ...food, [field]: value } : food,
      ),
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        mealType,
        foods: foods
          .map((food) => ({
            name: food.name.trim(),
            quantity: Number(food.quantity || 0),
            unit: food.unit.trim(),
          }))
          .filter((food) => food.name),
        nutrition: {
          calories: Number(nutrition.calories || 0),
          protein: Number(nutrition.protein || 0),
          carbs: Number(nutrition.carbs || 0),
          fat: Number(nutrition.fat || 0),
        },
      };

      const response = await saveMealLog(payload);
      setSuccess(response?.message || "Meal saved successfully.");
      setFoods([{ ...EMPTY_FOOD }]);
      setNutrition({ calories: "", protein: "", carbs: "", fat: "" });
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Meal log</h2>
        <p className="mt-1 text-slate-600">
          Log breakfast, lunch, dinner, or snacks. Existing logs for the same
          meal type and date are safely updated instead of duplicated.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <form onSubmit={submit} className="card space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Meal type</label>
            <select
              className="input mt-2"
              value={mealType}
              onChange={(event) => setMealType(event.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snacks</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Food items</label>
              <button
                type="button"
                className="text-sm font-medium text-emerald-600"
                onClick={() => setFoods((current) => [...current, { ...EMPTY_FOOD }])}
              >
                Add item
              </button>
            </div>
            {foods.map((food, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
                <input
                  className="input"
                  placeholder="Food name"
                  value={food.name}
                  onChange={(event) => updateFood(index, "name", event.target.value)}
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="Quantity"
                  value={food.quantity}
                  onChange={(event) => updateFood(index, "quantity", event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Unit"
                  value={food.unit}
                  onChange={(event) => updateFood(index, "unit", event.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {["calories", "protein", "carbs", "fat"].map((field) => (
              <div key={field}>
                <label className="text-sm font-medium capitalize text-slate-700">{field}</label>
                <input
                  className="input mt-2"
                  type="number"
                  min={0}
                  value={nutrition[field]}
                  onChange={(event) =>
                    setNutrition((current) => ({ ...current, [field]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save meal log"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Today's meal summary</h3>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Loading summary...</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Calories</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {summary?.totals?.calories || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Protein</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {summary?.totals?.protein || 0}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Carbs</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {summary?.totals?.carbs || 0}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Fat</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {summary?.totals?.fat || 0}g
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {summary?.rows?.length ? (
                    summary.rows.map((row) => (
                      <div key={row._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold capitalize text-slate-900">{row.mealType}</p>
                          <span className="text-sm text-slate-500">
                            {row.nutrition?.calories || 0} kcal
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No meals logged for today yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900">Recent meal logs</h3>
            <div className="mt-4 space-y-3">
              {recentLogs.length ? (
                recentLogs.slice(0, 6).map((row) => (
                  <div key={row._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold capitalize text-slate-900">{row.mealType}</p>
                      <span className="text-sm text-slate-500">
                        {new Date(row.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {row.foods?.map((food) => food.name).join(", ") || "No food items"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No meal logs available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
