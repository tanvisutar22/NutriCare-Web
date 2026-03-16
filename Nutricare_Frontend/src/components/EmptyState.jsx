export default function EmptyState({
  title = "No data available",
  description = "",
  actionText,
  onAction,
}) {
  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
      <p className="font-medium text-gray-700">{title}</p>

      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}

      {actionText && (
        <button
          onClick={onAction}
          className="mt-3 text-teal-600 text-sm font-medium hover:underline"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
