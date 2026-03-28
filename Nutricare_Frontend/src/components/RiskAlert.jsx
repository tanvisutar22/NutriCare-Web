import Card from "./Card";

function RiskBadge({ level = "low" }) {
  const styles = {
    high: "bg-rose-100 text-rose-700",
    moderate: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[level] || styles.low}`}>
      {level === "high" ? "⚠️ High Risk" : level === "moderate" ? "⚠️ Moderate" : "Stable"}
    </span>
  );
}

export default function RiskAlert({ riskLevel = "low", alerts = [] }) {
  return (
    <Card title="Health Risk Alerts" subtitle="Powered by the new risk service">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Rule-based checks for protein, calories, and under-eating patterns.
        </p>
        <RiskBadge level={riskLevel} />
      </div>

      {alerts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No active alerts right now.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-900">
                  {alert.label === "Low Protein" ? "⚠️ Low Protein" : `⚠️ ${alert.label}`}
                </div>
                <RiskBadge level={alert.level} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
