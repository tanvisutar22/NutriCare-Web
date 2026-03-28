export default function MainLayout({ title = "NutriCare", children }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          NutriCare
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
      </div>
      {children}
    </div>
  );
}
