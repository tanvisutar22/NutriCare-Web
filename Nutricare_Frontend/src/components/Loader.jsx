export default function Loader() {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3">
        <div className="h-6 w-6 rounded-full border-4 border-slate-300 border-t-teal-600 animate-spin" />
        <p className="text-slate-700 text-sm font-medium">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
}
