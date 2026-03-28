export default function Loader({ label = "Loading..." }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-3xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        {label}
      </div>
    </div>
  );
}
