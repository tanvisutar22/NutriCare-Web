import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import {
  createDietPlan,
  getDietStreakStats,
  getTodayDietPlan,
  listDietPlans,
  markTodayDietAsFollowed,
  updateDietStatus,
} from "../features/diets/dietsApi";
import { listBodyMetrics } from "../features/bodyMetrics/bodyMetricsApi";
import { getMyProfile } from "../features/user/userApi";
import { getLatestMetricsMap } from "../features/bodyMetrics/bodyMetricsHelpers";
import { DIET_STATUS_OPTIONS } from "../features/diets/dietsConstants";

function MealBlock({ title, foods }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {foods?.length ? (
        <div className="mt-3 space-y-2">
          {foods.map((food, index) => (
            <div key={`${food.foodName}-${index}`} className="rounded-xl bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-800">{food.foodName}</p>
                <p className="text-sm text-slate-500">{food.calories} kcal</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Protein {food.protein}g • Carbs {food.carbs}g • Fat {food.fat}g
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No foods for this meal.</p>
      )}
    </div>
  );
}

function StreakStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function DietsModule() {
  const [diets, setDiets] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [profileExists, setProfileExists] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [todayDiet, setTodayDiet] = useState(null);
  const [streaks, setStreaks] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalFollowedDays: 0,
    todayFollowed: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const [profileRes, metricRes, dietRes, streakRes, todayDietRes] =
        await Promise.allSettled([
          getMyProfile(),
          listBodyMetrics(),
          listDietPlans(),
          getDietStreakStats(),
          getTodayDietPlan(),
        ]);

      if (profileRes.status === "fulfilled") {
        setProfileExists(true);
      } else if (profileRes.reason?.response?.status === 404) {
        setProfileExists(false);
      }

      if (metricRes.status === "fulfilled") {
        setMetrics(Array.isArray(metricRes.value?.data) ? metricRes.value.data : []);
      }

      if (dietRes.status === "fulfilled") {
        setDiets(Array.isArray(dietRes.value?.data) ? dietRes.value.data : []);
      }

      if (streakRes.status === "fulfilled") {
        setStreaks({
          currentStreak: streakRes.value?.data?.currentStreak || 0,
          longestStreak: streakRes.value?.data?.longestStreak || 0,
          totalFollowedDays: streakRes.value?.data?.totalFollowedDays || 0,
          todayFollowed: Boolean(streakRes.value?.data?.todayFollowed),
        });
      }

      if (todayDietRes.status === "fulfilled") {
        setTodayDiet(todayDietRes.value?.data || null);
      } else {
        setTodayDiet(null);
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const latestMetrics = useMemo(() => getLatestMetricsMap(metrics), [metrics]);

  const latestDiet = useMemo(() => {
    return [...diets].sort((a, b) => {
      const aTime = new Date(a?.endDate || a?.startDate || 0).getTime();
      const bTime = new Date(b?.endDate || b?.startDate || 0).getTime();
      return bTime - aTime;
    })[0];
  }, [diets]);

  const planEnded = useMemo(() => {
    if (!latestDiet?.endDate) return false;
    const end = new Date(latestDiet.endDate);
    const now = new Date();
    return Number.isFinite(end.getTime()) && now > end;
  }, [latestDiet]);

  const hasRecentVariableMetrics = useMemo(() => {
    if (!planEnded) return true;
    const end = latestDiet?.endDate ? new Date(latestDiet.endDate) : null;
    if (!end || Number.isNaN(end.getTime())) return false;
    const weightDate = latestMetrics.weight?.recordedAt
      ? new Date(latestMetrics.weight.recordedAt)
      : null;
    const activityDate = latestMetrics.activityLevel?.recordedAt
      ? new Date(latestMetrics.activityLevel.recordedAt)
      : null;

    const weightOk =
      weightDate && !Number.isNaN(weightDate.getTime()) && weightDate > end;
    const activityOk =
      activityDate && !Number.isNaN(activityDate.getTime()) && activityDate > end;

    return Boolean(weightOk && activityOk);
  }, [planEnded, latestDiet, latestMetrics]);

  const canGenerateDiet =
    profileExists &&
    Boolean(latestMetrics.weight) &&
    Boolean(latestMetrics.activityLevel || latestMetrics.tdee);

  const readinessMessage = !profileExists
    ? "Create your profile before generating a diet."
    : !latestMetrics.weight
      ? "Add a weight metric before generating a diet."
      : !latestMetrics.activityLevel && !latestMetrics.tdee
        ? "Add activity level or let the backend resolve TDEE first."
        : planEnded && !hasRecentVariableMetrics
          ? "Your last plan ended. Please update weight and activity level before generating a new plan."
          : "";

  const groupedByDate = useMemo(() => {
    return [...diets].sort((a, b) => {
      const aTime = new Date(a?.startDate || 0).getTime();
      const bTime = new Date(b?.startDate || 0).getTime();
      return aTime - bTime;
    });
  }, [diets]);

  const handleCreateDiet = async () => {
    if (!startDate) {
      setError("Select a start date.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await createDietPlan({ startDate });
      setSuccess(res?.message || "Diet plan created successfully.");
      setStartDate("");
      await loadPage();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateDietStatus(id, status);
      await loadPage();
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    }
  };

  const handleFollowToday = async () => {
    setFollowLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await markTodayDietAsFollowed();
      const updatedDiet = response?.data?.diet || response?.data || null;
      if (updatedDiet) {
        setTodayDiet(updatedDiet);
        setDiets((current) =>
          current.map((diet) =>
            diet._id === updatedDiet._id ? { ...diet, ...updatedDiet } : diet,
          ),
        );
      }
      if (response?.data?.streaks) {
        setStreaks((current) => ({
          ...current,
          ...response.data.streaks,
          todayFollowed: true,
        }));
      } else {
        setStreaks((current) => ({ ...current, todayFollowed: true }));
      }
      setSuccess(response?.message || "Today's diet marked as followed.");
    } catch (followError) {
      setError(getApiErrorMessage(followError));
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">
            Diet Plans
          </p>
          <h1 className="section-title mt-2">Generate and manage 7-day meal plans</h1>
          <p className="section-copy">
            Review today&apos;s plan, mark it as completed once, and keep your streak moving.
          </p>
        </div>
        <Link to="/recipes" className="btn-secondary">
          Browse recipes
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Diet streak</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Your streak grows when today&apos;s diet is marked as followed.
                </p>
              </div>
              {streaks.todayFollowed || todayDiet?.isFollowed ? (
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Today&apos;s diet completed
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StreakStat label="Current Streak" value={`🔥 ${streaks.currentStreak || 0}`} />
              <StreakStat label="Longest Streak" value={`🏆 ${streaks.longestStreak || 0}`} />
              <StreakStat label="Total Followed" value={`✅ ${streaks.totalFollowedDays || 0}`} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {!todayDiet ? (
                <p className="text-sm text-slate-500">
                  No diet plan is available for today yet. Generate a plan first.
                </p>
              ) : streaks.todayFollowed || todayDiet.isFollowed ? (
                <p className="text-sm font-medium text-emerald-700">
                  Great work. You&apos;ve already marked today&apos;s plan as followed.
                </p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Mark today&apos;s meal plan as completed once you&apos;ve followed it.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={followLoading}
                    onClick={handleFollowToday}
                  >
                    {followLoading ? "Saving..." : "Mark Today as Followed"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Diet generation</h2>
            <p className="mt-2 text-sm text-slate-500">
              Send only the backend-supported payload: <code>{`{ startDate }`}</code>.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {canGenerateDiet
                ? "Profile and metric prerequisites are ready."
                : readinessMessage}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Start date</label>
                <input
                  className="input mt-2"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <button
                className="btn-primary w-full"
                disabled={!canGenerateDiet || creating || (planEnded && !hasRecentVariableMetrics)}
                onClick={handleCreateDiet}
              >
                {creating ? "Generating..." : "Generate 7-day plan"}
              </button>

              {planEnded && !hasRecentVariableMetrics ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your previous plan has ended. Update your{" "}
                  <Link className="font-medium underline" to="/metrics">
                    weight & activity level
                  </Link>{" "}
                  first.
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          {loading ? (
            <div className="card text-sm text-slate-500">Loading diet plans...</div>
          ) : groupedByDate.length === 0 ? (
            <div className="card text-sm text-slate-500">
              No diet plans generated yet.
            </div>
          ) : (
            groupedByDate.map((diet) => (
              <article key={diet._id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {diet.Day || "Diet day"}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                      {new Date(diet.startDate).toLocaleDateString()}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Created by {diet.createdBy || "ai"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {diet.isFollowed ? (
                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                        Followed
                      </span>
                    ) : null}
                    <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium capitalize text-emerald-700">
                      {diet.status}
                    </span>
                    <select
                      className="input max-w-[180px]"
                      value={diet.status}
                      onChange={(event) =>
                        handleStatusChange(diet._id, event.target.value)
                      }
                    >
                      {DIET_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Calories</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {diet.calorieTarget}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Protein</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {diet.proteinTarget}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Carbs</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {diet.carbTarget}g
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Fat</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {diet.fatTarget}g
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-4">
                  <MealBlock title="Breakfast" foods={diet.meals?.breakfast} />
                  <MealBlock title="Lunch" foods={diet.meals?.lunch} />
                  <MealBlock title="Dinner" foods={diet.meals?.dinner} />
                  <MealBlock title="Snacks" foods={diet.meals?.snacks} />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
