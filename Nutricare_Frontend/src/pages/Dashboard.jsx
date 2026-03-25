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
import { listDietPlans } from "../features/diets/dietsApi";
import { getLatestMetricsMap, sortMetricsByDate } from "../features/bodyMetrics/bodyMetricsHelpers";

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

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [profileRes, metricsRes, dietsRes] = await Promise.allSettled([
          getMyProfile(),
          listBodyMetrics(),
          listDietPlans(),
        ]);

        if (!active) return;

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value?.data || null);
        }
        if (metricsRes.status === "fulfilled") {
          setMetrics(Array.isArray(metricsRes.value?.data) ? metricsRes.value.data : []);
        }
        if (dietsRes.status === "fulfilled") {
          setDiets(Array.isArray(dietsRes.value?.data) ? dietsRes.value.data : []);
        }

        if (
          profileRes.status === "rejected" &&
          metricsRes.status === "rejected" &&
          dietsRes.status === "rejected"
        ) {
          throw profileRes.reason;
        }
      } catch (loadError) {
        if (active) setError(getApiErrorMessage(loadError));
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

  const chartData = useMemo(() => {
    return {
      labels: sortedWeights.map((metric) =>
        new Date(metric.recordedAt).toLocaleDateString(),
      ),
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
    };
  }, [sortedWeights]);

  const macroChartData = useMemo(() => {
    return {
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
    };
  }, [latestDiet]);

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
              Track your body metrics, review your daily diet plans, and showcase
              future-ready health intelligence from one polished workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/profile" className="btn-primary">
              Update profile
            </Link>
            <Link to="/metrics" className="btn-secondary">
              Log metrics
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Latest Weight"
          value={latestMetrics.weight ? `${latestMetrics.weight.value} kg` : "—"}
          subtitle="Most recent saved weight"
        />
        <StatCard
          title="Current BMI"
          value={latestMetrics.bmi ? latestMetrics.bmi.value : "—"}
          subtitle="Calculated from backend metrics"
        />
        <StatCard
          title="BMR"
          value={latestMetrics.bmr ? `${latestMetrics.bmr.value} kcal` : "—"}
          subtitle="Resting energy estimate"
        />
        <StatCard
          title="Diet Plans"
          value={String(diets.length)}
          subtitle={latestDiet ? `Latest status: ${latestDiet.status}` : "No diet plans yet"}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Weight progress</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest-by-type transformation is used before charting.
              </p>
            </div>
          </div>
          <div className="mt-6 h-[320px]">
            {sortedWeights.length > 0 ? (
              <Line
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
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
                <Doughnut
                  data={macroChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : (
                <div className="grid h-full place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                  Generate a diet plan to see macro targets.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900">Health insight panel</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">TDEE</p>
                <p className="mt-1 text-sm text-slate-500">
                  {latestMetrics.tdee ? `${latestMetrics.tdee.value} kcal/day` : "Add activity level to derive TDEE."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">Medical conditions</p>
                <p className="mt-1 text-sm text-slate-500">
                  {profile?.medicalConditions?.length
                    ? profile.medicalConditions.join(", ")
                    : "No saved profile data yet."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">Lifestyle hints</p>
                <p className="mt-1 text-sm text-slate-500">
                  Future-ready demo area for water, steps, streaks, and emotional
                  eating patterns. Not backed by API yet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Quick path</h2>
          <div className="mt-4 space-y-3">
            <Link to="/profile" className="block rounded-2xl bg-emerald-50 p-4">
              <p className="font-medium text-emerald-700">1. Profile summary</p>
              <p className="mt-1 text-sm text-emerald-600">
                {profile?.name
                  ? `Saved for ${profile.name}`
                  : "Create or update your health profile"}
              </p>
            </Link>
            <Link to="/metrics" className="block rounded-2xl bg-sky-50 p-4">
              <p className="font-medium text-sky-700">2. Metrics and metabolism</p>
              <p className="mt-1 text-sm text-sky-600">
                Save weight and activity to keep BMI, BMR, and TDEE current.
              </p>
            </Link>
            <Link to="/diets" className="block rounded-2xl bg-violet-50 p-4">
              <p className="font-medium text-violet-700">3. Diet plan overview</p>
              <p className="mt-1 text-sm text-violet-600">
                Review daily meals and status updates across the 7-day plan.
              </p>
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent diet documents</h2>
            <Link to="/diets" className="text-sm font-medium text-emerald-600">
              View all
            </Link>
          </div>
          {diets.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">No diet documents available yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Day</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Calories</th>
                  </tr>
                </thead>
                <tbody>
                  {diets.slice(0, 6).map((diet) => (
                    <tr key={diet._id} className="border-b border-slate-100">
                      <td className="px-3 py-3">
                        {new Date(diet.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">{diet.Day}</td>
                      <td className="px-3 py-3 capitalize">{diet.status}</td>
                      <td className="px-3 py-3">{diet.calorieTarget}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <button className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
        AI Coach Coming Soon
      </button>
    </div>
  );
}
