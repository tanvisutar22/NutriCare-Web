export default function MealCard({ title, foods }) {
  if (!foods || foods.length === 0) return null;

  return (
    <div className="bg-slate-50 p-4 rounded-xl">
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>

      {foods.map((food, index) => (
        <div
          key={index}
          className="flex justify-between text-sm text-slate-700 py-1 border-b last:border-none"
        >
          <span>{food.foodName}</span>
          <span>{food.calories} kcal</span>
        </div>
      ))}
    </div>
  );
}
