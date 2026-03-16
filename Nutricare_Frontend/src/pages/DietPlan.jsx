import { useState } from "react";

export default function DietPlan() {
  // ✅ Dummy multiple diet plans for testing
  const [dietPlans] = useState([
    {
      date: "2026-02-25",
      calorieTarget: 2000,
      proteinTarget: 100,
      totalPlannedCalories: 1800,
      totalPlannedProtein: 90,
      totalPlannedCarbs: 220,
      totalPlannedFats: 60,
      meals: [
        {
          mealType: "breakfast",
          totalCalories: 400,
          totalProtein: 20,
          totalCarbs: 50,
          totalFats: 10,
          foods: [
            {
              name: "Oatmeal",
              quantity: "1 bowl",
              calories: 150,
              protein: 5,
              carbs: 27,
              fats: 3,
            },
            {
              name: "Boiled Eggs",
              quantity: "2 pcs",
              calories: 140,
              protein: 12,
              carbs: 1,
              fats: 10,
            },
          ],
        },
        {
          mealType: "lunch",
          totalCalories: 600,
          totalProtein: 30,
          totalCarbs: 70,
          totalFats: 15,
          foods: [
            {
              name: "Grilled Chicken",
              quantity: "150g",
              calories: 300,
              protein: 35,
              carbs: 0,
              fats: 5,
            },
            {
              name: "Brown Rice",
              quantity: "1 cup",
              calories: 200,
              protein: 5,
              carbs: 45,
              fats: 2,
            },
          ],
        },
      ],
    },
    {
      date: "2026-02-26",
      calorieTarget: 2200,
      proteinTarget: 110,
      totalPlannedCalories: 2000,
      totalPlannedProtein: 95,
      totalPlannedCarbs: 250,
      totalPlannedFats: 70,
      meals: [
        {
          mealType: "dinner",
          totalCalories: 700,
          totalProtein: 35,
          totalCarbs: 60,
          totalFats: 20,
          foods: [
            {
              name: "Salmon",
              quantity: "200g",
              calories: 400,
              protein: 40,
              carbs: 0,
              fats: 20,
            },
            {
              name: "Quinoa",
              quantity: "1 cup",
              calories: 220,
              protein: 8,
              carbs: 40,
              fats: 4,
            },
          ],
        },
      ],
    },
  ]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-semibold text-teal-600 mb-6">Diet Plans</h2>

      {dietPlans.map((diet, idx) => (
        <div key={idx} className="bg-white shadow rounded p-6 mb-6">
          <p>
            <strong>Date:</strong> {diet.date}
          </p>
          <p>
            <strong>Calorie Target:</strong> {diet.calorieTarget} kcal
          </p>
          <p>
            <strong>Protein Target:</strong> {diet.proteinTarget} g
          </p>
          <p>
            <strong>Total Planned:</strong>
            {diet.totalPlannedCalories} kcal, {diet.totalPlannedProtein} g
            protein,
            {diet.totalPlannedCarbs} g carbs, {diet.totalPlannedFats} g fats
          </p>

          {diet.meals.map((meal, mIdx) => (
            <div key={mIdx} className="bg-gray-50 shadow rounded p-6 mt-4">
              <h3 className="text-lg font-semibold capitalize">
                {meal.mealType}
              </h3>
              <p>
                Calories: {meal.totalCalories}, Protein: {meal.totalProtein}g,
                Carbs: {meal.totalCarbs}g, Fats: {meal.totalFats}g
              </p>
              <ul className="list-disc pl-6 mt-2">
                {meal.foods.map((food, fIdx) => (
                  <li key={fIdx}>
                    {food.name} ({food.quantity}) — {food.calories} kcal, P:
                    {food.protein}g, C:{food.carbs}g, F:{food.fats}g
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
