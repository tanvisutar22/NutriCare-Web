import DailyTracking from "../models/dailyTracking.model.js";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const monthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function calculateStreaks(userId, now = new Date()) {
  const rows = await DailyTracking.find({
    userId,
    isTracked: true,
  }).sort({ date: 1 });

  const trackedDays = new Set(
    rows.map((row) => startOfDay(row.date).toISOString()),
  );

  const today = startOfDay(now);
  let currentStreak = 0;

  for (let cursor = new Date(today); ; cursor.setDate(cursor.getDate() - 1)) {
    const key = startOfDay(cursor).toISOString();
    if (!trackedDays.has(key)) break;
    currentStreak += 1;
  }

  let longestStreak = 0;
  let running = 0;
  let previous = null;

  for (const row of rows) {
    const current = startOfDay(row.date);
    if (!previous) {
      running = 1;
    } else {
      const diffDays = Math.round((current - previous) / 86400000);
      running = diffDays === 1 ? running + 1 : 1;
    }
    if (running > longestStreak) longestStreak = running;
    previous = current;
  }

  const { start, end } = monthRange(today.getFullYear(), today.getMonth() + 1);
  const monthlyTrackedDays = await DailyTracking.countDocuments({
    userId,
    isTracked: true,
    date: { $gte: start, $lte: end },
  });

  return {
    currentStreak,
    longestStreak,
    monthlyTrackedDays,
    todayTracked: trackedDays.has(today.toISOString()),
  };
}

export async function getMonthlyTrackingMap(userId, year, month) {
  const { start, end } = monthRange(year, month);
  const rows = await DailyTracking.find({
    userId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const map = new Map();
  rows.forEach((row) => {
    map.set(startOfDay(row.date).toISOString(), row);
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const calendar = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = startOfDay(new Date(year, month - 1, day));
    const key = date.toISOString();
    const row = map.get(key);
    calendar.push({
      date,
      day,
      isTracked: row?.isTracked || false,
      steps: row?.steps || 0,
      waterIntake: row?.waterIntake || 0,
      mood: row?.mood || "happy",
    });
  }

  return calendar;
}
