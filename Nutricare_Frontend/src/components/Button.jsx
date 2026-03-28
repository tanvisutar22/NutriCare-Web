export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary:
      "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-700",
    secondary:
      "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50",
  };

  return (
    <button
      type={type}
      className={`${styles[variant] || styles.primary} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
