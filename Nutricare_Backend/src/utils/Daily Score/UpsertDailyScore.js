import DailyScore from "../../models/dailyScore.model.js";
export async function upsertDailyScoreUnified({
  authId,
  date,
  data,        // AI parsed { meals, activities }
  targets,     // { targetCalories, targetProtein }
  goal,        // optional
  bmi          // optional
}) {
  // normalize date
  date = new Date(date);
  date.setHours(0, 0, 0, 0);

  // 1️⃣ decide goal (priority: goal > BMI)
  let finalGoal = goal;

  if (!finalGoal && bmi) {
    if (bmi < 18.5) finalGoal = "muscle_gain";
    else if (bmi > 25) finalGoal = "weight_loss";
    else finalGoal = "maintenance";
  }

  // fallback default
  if (!finalGoal) finalGoal = "maintenance";

  // 2️⃣ extract totals from AI data
  let actualCalories = 0;
  let actualProtein = 0;
  let caloriesBurned = 0;

  for (let meal of (data.meals || [])) {
    actualCalories += meal.nutrition?.calories || 0;
    actualProtein += meal.nutrition?.protein || 0;
  }

  for (let act of (data.activities || [])) {
    caloriesBurned += act.caloriesBurned || 0;
  }

  const targetCalories = targets.targetCalories || 1;
  const targetProtein = targets.targetProtein || 1;

  // 3️⃣ calculate scores (goal-based)
  let calorieScore = 0;
  let proteinScore = actualProtein / targetProtein;
  let activityScore = Math.min(caloriesBurned / 400, 1);
  let finalScore = 0;

  if (finalGoal === "weight_loss") {
    calorieScore = targetCalories / (actualCalories || 1);

    finalScore =
      calorieScore * 0.5 +
      proteinScore * 0.3 +
      activityScore * 0.2;
  }

  else if (finalGoal === "muscle_gain") {
    calorieScore = actualCalories / targetCalories;

    finalScore =
      calorieScore * 0.6 +
      proteinScore * 0.4;
  }

  else {
    // maintenance
    calorieScore =
      1 - Math.abs(actualCalories - targetCalories) / targetCalories;

    finalScore =
      calorieScore * 0.7 +
      proteinScore * 0.3;
  }

  // clamp
  calorieScore = Math.max(0, Math.min(calorieScore, 1.5));
  proteinScore = Math.max(0, Math.min(proteinScore, 1.5));

  // 4️⃣ tracked
  const isTracked =
    (data.meals?.length > 0) || (data.activities?.length > 0);

  // 5️⃣ upsert
  const daily = await DailyScore.findOneAndUpdate(
    { authId, date },
    {
      authId,
      date,

      targetCalories,
      targetProtein,

      actualCalories,
      actualProtein,
      caloriesBurned,

      calorieScore,
      proteinScore,
      activityScore,
      finalScore,

      isTracked
    },
    { upsert: true, new: true }
  );

  return daily;
}