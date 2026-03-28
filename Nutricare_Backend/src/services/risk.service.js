import DailyScore from "../models/dailyScore.model.js";

export async function calculateRiskAlerts(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);

  const scoreRows = await DailyScore.find({
    authId: userId,
    date: { $gte: startDate, $lte: today },
  }).sort({ date: 1 });

  const alerts = [];
  const tracked = scoreRows.filter((row) => row.isTracked);

  const lowProteinDays = tracked.filter(
    (row) =>
      Number(row.targetProtein) > 0 &&
      Number(row.actualProtein) < Number(row.targetProtein) * 0.7,
  ).length;

  const overCaloriesDays = tracked.filter(
    (row) =>
      Number(row.targetCalories) > 0 &&
      Number(row.actualCalories) > Number(row.targetCalories) * 1.15,
  ).length;

  const underEatingDays = tracked.filter(
    (row) =>
      Number(row.targetCalories) > 0 &&
      Number(row.actualCalories) < Number(row.targetCalories) * 0.7,
  ).length;

  if (lowProteinDays >= 2) {
    alerts.push({
      code: "low_protein",
      label: "Low Protein",
      level: "moderate",
      description: "Protein intake stayed below target across multiple tracked days.",
    });
  }

  if (overCaloriesDays >= 2) {
    alerts.push({
      code: "over_calories",
      label: "High Risk",
      level: "high",
      description: "Calories exceeded target repeatedly this week.",
    });
  }

  if (underEatingDays >= 2) {
    alerts.push({
      code: "under_eating",
      label: "Under Eating",
      level: "moderate",
      description: "Calorie intake remained well below target on multiple days.",
    });
  }

  return {
    riskLevel: alerts.some((alert) => alert.level === "high")
      ? "high"
      : alerts.length
        ? "moderate"
        : "low",
    alerts,
  };
}
