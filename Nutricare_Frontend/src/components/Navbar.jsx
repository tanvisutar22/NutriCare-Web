import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { doctorLogoutThunk } from "../store/slices/doctorAuthSlice";
import { adminLogoutThunk } from "../store/slices/adminAuthSlice";

function Item({ to, label, closeMenu, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={closeMenu}
      className={({ isActive }) =>
        [
          "block rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-900/30"
            : "text-slate-200 hover:bg-white/8",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

function Drawer({ open, title, items, onClose, onLogout }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/65"
        onClick={onClose}
        aria-label="Close navigation"
      />
      <div className="absolute left-0 top-0 h-full w-full max-w-xs border-r border-white/10 bg-[linear-gradient(180deg,rgba(6,12,31,0.98),rgba(9,22,52,0.98))] shadow-2xl md:max-w-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              NutriCare
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-2 px-4 py-5">
          {items.map((item) => (
            <Item key={item.to} to={item.to} label={item.label} closeMenu={onClose} end={item.end} />
          ))}
        </div>

        {onLogout ? (
          <div className="border-t border-white/10 px-4 py-4">
            <button onClick={onLogout} className="btn-secondary w-full">
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const publicItems = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
];

const userItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/metrics", label: "Body Metrics" },
  { to: "/diets", label: "Diet" },
  { to: "/recipes", label: "Smart Meal Preparation" },
  { to: "/doctor-booking", label: "Doctor Consultation" },
  { to: "/notes", label: "Doctor Notes" },
  { to: "/billing", label: "Upgrade / Subscription" },
];

const doctorItems = [
  { to: "/doctor/dashboard", label: "Dashboard", end: true },
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/notes", label: "Notes / Suggestions" },
  { to: "/doctor/profile", label: "Profile" },
];
const adminItems = [{ to: "/admin", label: "Admin Dashboard", end: true }];

function PublicDesktopNav({ onHome }) {
  const links = onHome
    ? [
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How It Works" },
        { href: "#plans", label: "Plans" },
        { href: "#faq", label: "FAQ" },
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/about", label: "About" },
      ];

  return (
    <div className="hidden items-center gap-3 lg:flex">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-2 backdrop-blur">
        {links.map((link) =>
          link.href ? (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ),
        )}
      </div>

      <Link
        to="/login"
        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/20 hover:text-white"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:-translate-y-0.5 hover:shadow-cyan-800/40"
      >
        Register
      </Link>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, logout } = useAuth();
  const doctorAuth = useSelector((state) => state.doctorAuth);
  const adminAuth = useSelector((state) => state.adminAuth);
  const [open, setOpen] = useState(false);

  const isDoctorArea =
    location.pathname === "/doctor" || location.pathname.startsWith("/doctor/");
  const isAdminArea = location.pathname.startsWith("/admin");
  const isDoctorWorkspace =
    isDoctorArea && location.pathname !== "/doctor/login" && location.pathname !== "/doctor/register";
  const isAdminWorkspace = isAdminArea && location.pathname !== "/admin/login";
  const showDoctorNav = isDoctorWorkspace;
  const showAdminNav = !showDoctorNav && isAdminWorkspace;
  const showUserNav = isAuthenticated && !isDoctorArea && !isAdminArea;
  const isPublicHome = !showUserNav && !showDoctorNav && !showAdminNav && location.pathname === "/";

  let title = "Public Navigation";
  let items = publicItems;
  let onLogout = null;

  if (showUserNav) {
    title = "User Navigation";
    items = userItems;
    onLogout = async () => {
      await logout();
      navigate("/login", { replace: true });
      setOpen(false);
    };
  } else if (showDoctorNav) {
    title = "Doctor Navigation";
    items = doctorItems;
    onLogout = doctorAuth.isAuthenticated
      ? async () => {
          await dispatch(doctorLogoutThunk());
          navigate("/doctor/login", { replace: true });
          setOpen(false);
        }
      : null;
  } else if (showAdminNav) {
    title = "Admin Navigation";
    items = adminItems;
    onLogout = adminAuth.isAuthenticated
      ? async () => {
          await dispatch(adminLogoutThunk());
          navigate("/admin/login", { replace: true });
          setOpen(false);
        }
      : null;
  }

  return (
    <>
      <header
        className={
          isPublicHome
            ? "sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl"
            : "sticky top-0 z-40 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl"
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {isPublicHome ? (
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 text-lg font-bold text-white shadow-lg shadow-cyan-900/40">
                N
              </div>
              <div>
                <p className="text-base font-bold text-white">NutriCare</p>
                <p className="text-xs text-slate-300">
                  Personalized wellness and diet management
                </p>
              </div>
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-100 shadow-sm"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <span className="text-lg">|||</span>
            </button>
          )}

          <Link
            to={showAdminNav ? "/admin" : showDoctorNav ? "/doctor/dashboard" : showUserNav ? "/dashboard" : "/"}
            className={isPublicHome ? "hidden" : "flex items-center gap-3 text-right"}
          >
            <div>
              <p className="text-base font-bold text-white">NutriCare</p>
              <p className="text-xs text-slate-300">
                {showAdminNav
                  ? "Admin console"
                  : showDoctorNav
                    ? "Doctor workspace"
                    : showUserNav
                      ? "User health workspace"
                      : "AI wellness and diet management"}
              </p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-emerald-200">
              N
            </div>
          </Link>

          {isPublicHome ? <PublicDesktopNav onHome /> : null}
        </div>
      </header>

      {!isPublicHome ? (
        <Drawer open={open} title={title} items={items} onClose={() => setOpen(false)} onLogout={onLogout} />
      ) : null}
    </>
  );
}
