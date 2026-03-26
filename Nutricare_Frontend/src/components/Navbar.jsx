import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navClass(isActive) {
  return [
    "rounded-2xl px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-3"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-emerald-200">
            N
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">NutriCare</p>
            <p className="text-xs text-slate-500">Health and diet intelligence</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {!isAuthenticated ? (
            <>
              <NavLink to="/" className={({ isActive }) => navClass(isActive)}>
                Home
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => navClass(isActive)}>
                About
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => navClass(isActive)}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => navClass(isActive)}>
                Register
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => navClass(isActive)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => navClass(isActive)}
              >
                Profile
              </NavLink>
              <NavLink
                to="/metrics"
                className={({ isActive }) => navClass(isActive)}
              >
                Metrics
              </NavLink>
              <NavLink to="/diets" className={({ isActive }) => navClass(isActive)}>
                Diets
              </NavLink>
              <NavLink
                to="/billing"
                className={({ isActive }) => navClass(isActive)}
              >
                Billing
              </NavLink>
              <NavLink
                to="/recipes"
                className={({ isActive }) => navClass(isActive)}
              >
                Recipes
              </NavLink>
              <NavLink
                to="/notes"
                className={({ isActive }) => navClass(isActive)}
              >
                Notes
              </NavLink>
              <NavLink
                to="/daily-log"
                className={({ isActive }) => navClass(isActive)}
              >
                Daily log
              </NavLink>
              <div className="ml-3 text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "NutriCare User"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.hasProfile ? "Profile ready" : "Complete profile"}
                </p>
              </div>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          )}
        </nav>

        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {!isAuthenticated ? (
              <>
                <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Home
                </NavLink>
                <NavLink to="/about" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  About
                </NavLink>
                <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Login
                </NavLink>
                <NavLink to="/register" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Register
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Dashboard
                </NavLink>
                <NavLink to="/profile" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Profile
                </NavLink>
                <NavLink to="/metrics" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Metrics
                </NavLink>
                <NavLink to="/diets" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Diets
                </NavLink>
                <NavLink to="/billing" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Billing
                </NavLink>
                <NavLink to="/recipes" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Recipes
                </NavLink>
                <NavLink to="/notes" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Notes
                </NavLink>
                <NavLink to="/daily-log" onClick={() => setOpen(false)} className={({ isActive }) => navClass(isActive)}>
                  Daily log
                </NavLink>
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
