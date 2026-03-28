import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/diets", label: "Diet" },
  { to: "/daily-tracking", label: "Daily Tracking" },
  { to: "/analytics", label: "Analytics" },
  { to: "/recipes", label: "Recipes" },
  { to: "/chat", label: "Chat" },
];

function navClass(isActive) {
  return [
    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function MainLayout({ title = "NutriCare", children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7_0%,#eff6ff_40%,#f8fafc_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-transform lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              NutriCare
            </p>
            <h1 className="mt-3 text-xl font-bold">AI-Based Diet & Activity Tracking</h1>
            <p className="mt-2 text-sm text-white/80">
              New layout wrapper that can sit on top of your existing pages.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navClass(isActive)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 lg:hidden"
                  onClick={() => setOpen(true)}
                >
                  Menu
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Wrapper Layout
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
