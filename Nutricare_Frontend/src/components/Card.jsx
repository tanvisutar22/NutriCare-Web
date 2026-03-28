export default function Card({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur ${className}`.trim()}
    >
      {title ? <h3 className="text-xl font-semibold text-slate-900">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
