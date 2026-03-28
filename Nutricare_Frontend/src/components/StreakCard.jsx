import Card from "./Card";

export default function StreakCard({
  currentStreak = 0,
  longestStreak = 0,
  monthlyTrackedDays = 0,
}) {
  return (
    <Card title="Streak Tracker" subtitle="Built for the new streak service">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Current
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            🔥 {currentStreak}
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Longest
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900">
            🏆 {longestStreak}
          </div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Monthly
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-900">{monthlyTrackedDays}</div>
        </div>
      </div>
    </Card>
  );
}
