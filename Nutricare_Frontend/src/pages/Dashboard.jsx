import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { getApiErrorMessage } from "../shared/api/http";
import { getMyProfile } from "../features/user/userApi";
import { listBodyMetrics } from "../features/bodyMetrics/bodyMetricsApi";
import {
  getDietStreakStats,
  getTodayDietPlan,
  listDietPlans,
  markTodayDietAsFollowed,
} from "../features/diets/dietsApi";
import {
  getLatestMetricsMap,
  sortMetricsByDate,
} from "../features/bodyMetrics/bodyMetricsHelpers";
import { getHealthRisk } from "../features/dashboard/dashboardApi";
import { listMyDoctorNotes } from "../features/notes/notesApi";
import { getMealLogSummary } from "../features/mealLogs/mealLogsApi";
import { getMySubscription } from "../features/subscriptions/subscriptionsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

function StatCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function MealPreview({ title, foods }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{Array.isArray(foods) ? foods.length : 0} items</span>
      </div>
      {foods?.length ? (
        <div className="mt-3 space-y-2">
          {foods.slice(0, 2).map((food, index) => (
            <div
              key={`${title}-${food.foodName || "meal"}-${index}`}
              className="rounded-xl bg-white px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">
                  {food.foodName || "Meal item"}
                </p>
                <p className="text-xs text-slate-500">
                  {food.calories ? `${food.calories} kcal` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No meal items available.</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [diets, setDiets] = useState([]);
  const [todayDiet, setTodayDiet] = useState(null);
  const [streaks, setStreaks] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalFollowedDays: 0,
    todayFollowed: false,
  });
  const [risk, setRisk] = useState(null);
  const [notes, setNotes] = useState([]);
  const [mealSummary, setMealSummary] = useState({ totals: {}, rows: [] });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getMyProfile(),
          listBodyMetrics(),
          listDietPlans(),
          getTodayDietPlan(),
          getDietStreakStats(),
          getHealthRisk(),
          listMyDoctorNotes(),
          getMealLogSummary(),
          getMySubscription(),
        ]);

        if (!active) return;

        const [
          profileRes,
          metricsRes,
          dietsRes,
          todayDietRes,
          streakRes,
          riskRes,
          notesRes,
          mealSummaryRes,
          subscriptionRes,
        ] = results;

        if (profileRes.status === "fulfilled") setProfile(profileRes.value?.data || null);
        if (metricsRes.status === "fulfilled") setMetrics(Array.isArray(metricsRes.value?.data) ? metricsRes.value.data : []);
        if (dietsRes.status === "fulfilled") setDiets(Array.isArray(dietsRes.value?.data) ? dietsRes.value.data : []);
        if (todayDietRes.status === "fulfilled") setTodayDiet(todayDietRes.value?.data || null);
        if (streakRes.status === "fulfilled") {
          setStreaks({
            currentStreak: streakRes.value?.data?.currentStreak || 0,
            longestStreak: streakRes.value?.data?.longestStreak || 0,
            totalFollowedDays: streakRes.value?.data?.totalFollowedDays || 0,
            todayFollowed: Boolean(streakRes.value?.data?.todayFollowed),
          });
        }
        if (riskRes.status === "fulfilled") setRisk(riskRes.value?.data || null);
        if (notesRes.status === "fulfilled") setNotes(Array.isArray(notesRes.value?.data) ? notesRes.value.data : []);
        if (mealSummaryRes.status === "fulfilled") setMealSummary(mealSummaryRes.value?.data || { totals: {}, rows: [] });
        if (subscriptionRes.status === "fulfilled") setSubscription(subscriptionRes.value?.data || null);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const latestMetrics = useMemo(() => getLatestMetricsMap(metrics), [metrics]);
  const sortedWeights = useMemo(
    () => sortMetricsByDate(metrics.filter((metric) => metric.metricType === "weight")).reverse(),
    [metrics],
  );
  const latestDiet = useMemo(() => {
    return [...diets].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.startDate || 0).getTime();
      const bTime = new Date(b?.createdAt || b?.startDate || 0).getTime();
      return bTime - aTime;
    })[0];
  }, [diets]);

  const chartData = useMemo(() => ({
    labels: sortedWeights.map((metric) => new Date(metric.recordedAt).toLocaleDateString()),
    datasets: [
      {
        label: "Weight (kg)",
        data: sortedWeights.map((metric) => Number(metric.value)),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15,118,110,0.18)",
        fill: true,
        tension: 0.35,
      },
    ],
  }), [sortedWeights]);

  const macroChartData = useMemo(() => ({
    labels: ["Protein", "Carbs", "Fat"],
    datasets: [
      {
        data: [
          latestDiet?.proteinTarget || 0,
          latestDiet?.carbTarget || 0,
          latestDiet?.fatTarget || 0,
        ],
        backgroundColor: ["#10b981", "#38bdf8", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  }), [latestDiet]);

  const handleFollowToday = async () => {
    setFollowLoading(true);
    setError("");
    try {
      const response = await markTodayDietAsFollowed();
      const updatedDiet = response?.data?.diet || response?.data || null;
      setTodayDiet(updatedDiet);
      if (response?.data?.streaks) {
        setStreaks((current) => ({
          ...current,
          ...response.data.streaks,
          todayFollowed: true,
        }));
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="card overflow-hidden bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.14),rgba(255,255,255,0.92))]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              NutriCare Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Welcome back{profile?.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review your daily diet, recent meal activity, streak progress, and
              latest doctor guidance from one clean workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/meal-log" className="btn-primary">Log Meal</Link>
            <Link to="/daily-log" className="btn-secondary">Open Chat Assistant</Link>
            <Link to="/diets" className="btn-secondary">View Diet</Link>
            <Link to="/billing" className="btn-secondary">Upgrade</Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Latest Weight" value={latestMetrics.weight ? `${latestMetrics.weight.value} kg` : "-"} subtitle="Most recent saved weight" />
        <StatCard title="Current BMI" value={latestMetrics.bmi ? latestMetrics.bmi.value : "-"} subtitle="Calculated from backend metrics" />
        <StatCard title="BMR" value={latestMetrics.bmr ? `${latestMetrics.bmr.value} kcal` : "-"} subtitle="Resting energy estimate" />
        <StatCard title="Premium" value={subscription?.planType || "Free"} subtitle={subscription?.remainingDays ? `${subscription.remainingDays} days remaining` : "Upgrade for premium access"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Diet streaks</h2>
              <p className="mt-1 text-sm text-slate-500">
                Start following your diet today to build a streak.
              </p>
            </div>
            <Link to="/diets" className="text-sm font-medium text-emerald-600">Open Diet</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <StatCard title="Current Streak" value={streaks.currentStreak} subtitle="Days in a row" />
            <StatCard title="Longest Streak" value={streaks.longestStreak} subtitle="Best run" />
            <StatCard title="Total Followed" value={streaks.totalFollowedDays} subtitle="Completed days" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Meal log summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Today's logged calories and macros.
              </p>
            </div>
            <Link to="/meal-log" className="text-sm font-medium text-emerald-600">Log Meal</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Calories</p><p className="mt-2 text-2xl font-bold text-slate-900">{mealSummary?.totals?.calories || 0}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Protein</p><p className="mt-2 text-2xl font-bold text-slate-900">{mealSummary?.totals?.protein || 0}g</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Carbs</p><p className="mt-2 text-2xl font-bold text-slate-900">{mealSummary?.totals?.carbs || 0}g</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Fat</p><p className="mt-2 text-2xl font-bold text-slate-900">{mealSummary?.totals?.fat || 0}g</p></div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Weight progress</h2>
          <div className="mt-6 h-[320px]">
            {sortedWeights.length > 0 ? (
              <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="grid h-full place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                Add weight metrics to unlock the progress chart.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900">Diet macro split</h2>
            <div className="mt-6 h-[260px]">
              {latestDiet ? (
                <Doughnut data={macroChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              ) : (
                <div className="grid h-full place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                  Generate a diet plan to see macro targets.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900">Health insights</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">Risk level</p>
                <p className="mt-1 text-sm text-slate-500">{risk?.riskLevel ? String(risk.riskLevel) : "-"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">TDEE</p>
                <p className="mt-1 text-sm text-slate-500">
                  {latestMetrics.tdee ? `${latestMetrics.tdee.value} kcal/day` : "Add activity level to derive TDEE."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Today's Diet Plan</h2>
              <p className="mt-1 text-sm text-slate-500">
                Breakfast, lunch, dinner, and snacks if available.
              </p>
            </div>
            <Link to="/diets" className="text-sm font-medium text-emerald-600">View Full Diet</Link>
          </div>
          {!todayDiet ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No diet plan available for today.
            </div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {todayDiet.isFollowed || streaks.todayFollowed ? (
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Today's diet completed
                  </span>
                ) : (
                  <button type="button" className="btn-primary" onClick={handleFollowToday} disabled={followLoading}>
                    {followLoading ? "Saving..." : "Mark as Followed"}
                  </button>
                )}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <MealPreview title="Breakfast" foods={todayDiet.meals?.breakfast} />
                <MealPreview title="Lunch" foods={todayDiet.meals?.lunch} />
                <MealPreview title="Dinner" foods={todayDiet.meals?.dinner} />
                <MealPreview title="Snacks" foods={todayDiet.meals?.snacks} />
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Doctor Notes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest recommendations added to your account.
              </p>
            </div>
            <Link to="/notes" className="text-sm font-medium text-emerald-600">View All Notes</Link>
          </div>
          {notes.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No doctor notes yet.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {notes.slice(0, 3).map((note) => (
                <div key={note._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{note.title || "Doctor recommendation"}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {note.doctorAuthId?.email || "NutriCare doctor"} | {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "Recently added"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
