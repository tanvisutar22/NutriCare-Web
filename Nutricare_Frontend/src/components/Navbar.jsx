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
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
            : "text-slate-700 hover:bg-slate-100",
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
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
        aria-label="Close navigation"
      />
      <div className="absolute left-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl md:max-w-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              NutriCare
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
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
          <div className="border-t border-slate-200 px-4 py-4">
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
  { to: "/recipes", label: "Recipes" },
  { to: "/doctor-booking", label: "Doctor" },
  { to: "/notes", label: "Notes" },
  { to: "/daily-log", label: "Chat Assistant" },
  { to: "/billing", label: "Upgrade / Subscription" },
];

const doctorItems = [
  { to: "/doctor/dashboard", label: "Dashboard", end: true },
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/notes", label: "Notes / Suggestions" },
  { to: "/doctor/profile", label: "Profile" },
];
const adminItems = [{ to: "/admin", label: "Admin Dashboard", end: true }];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, logout } = useAuth();
  const doctorAuth = useSelector((state) => state.doctorAuth);
  const adminAuth = useSelector((state) => state.adminAuth);
  const [open, setOpen] = useState(false);

  const isDoctorArea = location.pathname.startsWith("/doctor");
  const isAdminArea = location.pathname.startsWith("/admin");
  const showDoctorNav = doctorAuth.isAuthenticated && isDoctorArea;
  const showAdminNav = adminAuth.isAuthenticated && isAdminArea;
  const showUserNav = isAuthenticated && !isDoctorArea && !isAdminArea;

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
    onLogout = async () => {
      await dispatch(doctorLogoutThunk());
      navigate("/doctor/login", { replace: true });
      setOpen(false);
    };
  } else if (showAdminNav) {
    title = "Admin Navigation";
    items = adminItems;
    onLogout = async () => {
      await dispatch(adminLogoutThunk());
      navigate("/admin/login", { replace: true });
      setOpen(false);
    };
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <span className="text-lg">|||</span>
          </button>

          <Link
            to={showAdminNav ? "/admin" : showDoctorNav ? "/doctor/dashboard" : showUserNav ? "/dashboard" : "/"}
            className="flex items-center gap-3 text-right"
          >
            <div>
              <p className="text-base font-bold text-slate-900">NutriCare</p>
              <p className="text-xs text-slate-500">
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
        </div>
      </header>

      <Drawer open={open} title={title} items={items} onClose={() => setOpen(false)} onLogout={onLogout} />
    </>
  );
}
