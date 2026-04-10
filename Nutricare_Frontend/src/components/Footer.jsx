import { useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        {!isHomePage ? <p>© {new Date().getFullYear()} NutriCare</p> : null}
      </div>
    </footer>
  );
}
