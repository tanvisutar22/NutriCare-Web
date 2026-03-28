import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import MainLayout from "../components/MainLayout";
import Card from "../components/Card";
import PremiumLock from "../components/PremiumLock";
import Loader from "../components/ui/Loader";
import { getApiErrorMessage } from "../shared/api/http";
import { getStreak, getWeight } from "../features/dashboard/dashboardApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

export default function Analytics() {
  const now = dayjs();
  const [weights, setWeights] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [weightRes, streakRes] = await Promise.all([
          getWeight(now.year(), now.month() + 1),
          getStreak(now.year(), now.month() + 1),
        ]);
        setWeights(weightRes?.data || []);
        setScores(streakRes?.data || []);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const weightChart = useMemo(() => ({
    labels: weights.map((row) => row.day),
    datasets: [
      {
        label: "Weight",
        data: weights.map((row) => row.weight),
        borderColor: "#0f766e",
        backgroundColor: "rgba(15,118,110,0.15)",
        tension: 0.35,
      },
    ],
  }), [weights]);

  const scoreChart = useMemo(() => ({
    labels: scores.map((row) => row.day),
    datasets: [
      {
        label: "Score",
        data: scores.map((row) => Math.round((row.score || 0) * 100)),
        backgroundColor: "#10b981",
        borderRadius: 12,
      },
    ],
  }), [scores]);

  const trackedVsOpen = useMemo(() => {
    const tracked = scores.filter((row) => row.isTracked).length;
    const open = Math.max(0, scores.length - tracked);
    return {
      labels: ["Tracked", "Open"],
      datasets: [
        {
          data: [tracked, open],
          backgroundColor: ["#14b8a6", "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    };
  }, [scores]);

  return (
    <MainLayout title="Analytics">
      <div className="space-y-6">
        <PremiumLock copy="Use this as the premium analytics screen once you wire it into your routing." />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {loading ? (
          <Loader label="Loading analytics..." />
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card title="Weight Trend" subtitle="Monthly weight visualization">
                <div className="h-[320px]">
                  <Line data={weightChart} options={{ maintainAspectRatio: false }} />
                </div>
              </Card>

              <Card title="Monthly Tracking" subtitle="Tracked vs not tracked">
                <div className="h-[320px]">
                  <Doughnut
                    data={trackedVsOpen}
                    options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                  />
                </div>
              </Card>
            </div>

            <Card title="Score Trend" subtitle="Daily tracking score overview">
              <div className="h-[360px]">
                <Bar
                  data={scoreChart}
                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
