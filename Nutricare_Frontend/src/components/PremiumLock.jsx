import Button from "./Button";

export default function PremiumLock({
  title = "Upgrade to Premium",
  copy = "Unlock this feature with a premium subscription.",
}) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,rgba(254,243,199,0.7),rgba(255,255,255,0.95))] p-6 shadow-[0_20px_60px_-34px_rgba(180,83,9,0.35)]">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
        Premium Lock
      </div>
      <h3 className="mt-3 text-2xl font-bold text-slate-900">🔒 {title}</h3>
      <p className="mt-2 text-sm text-slate-600">{copy}</p>
      <Button className="mt-4">Upgrade to Premium</Button>
    </div>
  );
}
