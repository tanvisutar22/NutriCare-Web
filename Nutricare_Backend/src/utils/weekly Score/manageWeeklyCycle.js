import WeeklyScore from "../../models/weeklyScoreSchema.js";
async function manageWeeklyCycle(userId, dietPlanId) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1️⃣ Find active week
  const activeWeek = await WeeklyScore.findOne({
    userId,
    isActive: true
  });

  // 2️⃣ If active week exists → close it
  if (activeWeek) {

    const endDate = new Date(activeWeek.endDate);
    endDate.setHours(0, 0, 0, 0);

    // 🔥 condition handling
    if (today <= endDate) {
      // close early (user regenerated plan)
      activeWeek.endDate = today;
    }
    // if today > endDate → keep old endDate (already expired)

    activeWeek.isActive = false;
    await activeWeek.save();
  }

  // 3️⃣ Create new week (7 days from today)
  const newEndDate = new Date(today);
  newEndDate.setDate(today.getDate() + 7);

  const newWeek = await WeeklyScore.create({
    userId,
    dietPlanId,
    startDate: today,
    endDate: newEndDate,
    isActive: true,
    daysTracked: 0,
    streakDays: 0
  });

  return newWeek;
}
export default manageWeeklyCycle;