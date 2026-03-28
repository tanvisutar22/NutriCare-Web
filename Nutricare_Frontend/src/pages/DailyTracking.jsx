import { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import StreakCard from "../components/StreakCard";
import RiskAlert from "../components/RiskAlert";
import Loader from "../components/ui/Loader";
import { http, getApiErrorMessage } from "../shared/api/http";

const initialForm = {
  steps: "",
  waterIntake: "",
  mood: "happy",
};

export default function DailyTracking() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/daily-tracking/status");
      setStatus(res.data?.data || null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await http.put("/daily-tracking/today", {
        steps: Number(form.steps) || 0,
        waterIntake: Number(form.waterIntake) || 0,
        mood: form.mood,
      });
      setSuccess(res.data?.message || "Tracking saved.");
      setForm(initialForm);
      await load();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Daily Tracking">
      <div className="space-y-6">
        <Card
          title="Daily Tracking"
          subtitle="New add-on page for steps, water intake, and mood tracking."
        >
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-medium text-slate-700">Steps</label>
              <input
                className="input mt-2"
                type="number"
                min="0"
                value={form.steps}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, steps: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Water intake</label>
              <input
                className="input mt-2"
                type="number"
                min="0"
                step="0.1"
                value={form.waterIntake}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, waterIntake: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mood</label>
              <select
                className="input mt-2"
                value={form.mood}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, mood: event.target.value }))
                }
              >
                <option value="happy">Happy</option>
                <option value="stressed">Stressed</option>
                <option value="emotional eating">Emotional eating</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save tracking"}
              </Button>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                Status: {status?.streaks?.todayTracked ? "Tracked" : "Not Tracked"}
              </span>
            </div>
          </form>

          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          {success ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
        </Card>

        {loading ? (
          <Loader label="Loading tracking modules..." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <StreakCard {...status?.streaks} />
            <RiskAlert {...status?.risks} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
