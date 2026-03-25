export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="card bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(56,189,248,0.12),rgba(255,255,255,0.96))]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
          About NutriCare
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          A smarter health and diet tracking experience
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          NutriCare is designed as a modern full-stack project demo where the
          frontend turns profile data, body metrics, and generated meal plans into
          an experience that is easy to present, explain, and extend.
        </p>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Current scope</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Profile management, body metrics, diet generation, food browsing, and
            recipe lookup are all connected to the existing backend contract.
          </p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Project demo story</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The app shows how collected health data can drive calorie targets,
            macro planning, and personalized food exploration.
          </p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Future expansion</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            AI chat, doctor consultation, advanced risk prediction, and premium
            personalization are represented as frontend-ready future scope areas.
          </p>
        </div>
      </section>
    </div>
  );
}
