export default function GlobalLoader({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl px-6 py-4 shadow">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
}
