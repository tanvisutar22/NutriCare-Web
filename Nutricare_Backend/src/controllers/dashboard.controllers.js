import dailyScoreSchema from "../models/dailyScore.model.js";
import BodyMetrics from "../models/bodyMetrics.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
async function getMonthlyDayWise(authId, year, month) {
  // month: 1–12

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // fetch all days in DB
  const records = await dailyScoreSchema.find({
    authId,
    date: { $gte: startDate, $lte: endDate }
  });

  // convert to map for fast lookup
  const map = new Map();
  records.forEach(r => {
    map.set(r.date.toDateString(), r);
  });

  const result = [];

  const totalDays = endDate.getDate();

  // loop all days of month
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0);

    const key = currentDate.toDateString();
    const record = map.get(key);

    result.push({
      date: currentDate,
      day, // 1–31
      isTracked: record ? record.isTracked : false,
      score: record ? record.finalScore : 0
    });
  }

  return result;
}
async function getMonthlyWeight(authId, year, month) {
  // month: 1–12
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
    console.log("Fetching BodyMetrics for authId:", authId, "from", startDate, "to", endDate);
  // 1️⃣ Get records inside month
//   console.log( await BodyMetrics.find({
//     authId
//   }));
  const records = await BodyMetrics.find({
    authId,
    recordedAt: { $gte: startDate, $lte: endDate }

  }).sort({ recordedAt: 1 });
//   console.log("BodyMetrics records for month:", records);
  // 2️⃣ Get last weight BEFORE this month
  const lastRecord = await BodyMetrics.findOne({
    authId,
    recordedAt: { $lt: startDate }
  }).sort({ recordedAt: -1 });

  // 3️⃣ Map for quick lookup
  const map = new Map();
  
 records.forEach(r => {
  const key = new Date(r.recordedAt).toISOString().split("T")[0];
    console.log("Mapping weight record:",r);
  if (r.metricType === "weight" && r.value != null) {
    map.set(key, r.value);
  }
});

  const result = [];
  const totalDays = endDate.getDate();
//   console.log(map);
  // 4️⃣ Start with previous weight
  let lastWeight = lastRecord ? lastRecord.weight : null;

  // 5️⃣ Loop all days
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month - 1, day);
    currentDate.setHours(0, 0, 0, 0);

    const key = currentDate.toISOString().split("T")[0];
    // console.log("Checking weight for date:", currentDate, "key:", key);
    // If weight exists for this day → update lastWeight
    if (map.has(key)) {
      lastWeight = map.get(key);
    }

    result.push({
      day,
      date: currentDate,
      weight: lastWeight // carries forward
    });
  }

  return result;
}
async function detectHealthRisk(authId) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6); // last 7 days

  console.log(await BodyMetrics.find({
    authId
  }));

  const records = await BodyMetrics.find({
    authId,
    recordedAt: { $gte: startDate, $lte: today }

  }).sort({ recordedAt: 1 });

  if (records.length === 0) {
    return { risk: "no_data" };
  }

  // extract values
  const bmiValues = records
  .filter(r => r.metricType === "bmi")
  .map(r => r.value);

const bmrValues = records
  .filter(r => r.metricType === "bmr")
  .map(r => r.value);

const tdeeValues = records
  .filter(r => r.metricType === "tdee")
  .map(r => r.value);

  // averages
  const avg = arr =>
    arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

  const avgBMI = avg(bmiValues);
  const avgBMR = avg(bmrValues);
  const avgTDEE = avg(tdeeValues);

  // trend (first vs last)
  const firstBMI = bmiValues[0];
  const lastBMI = bmiValues[bmiValues.length - 1];

  let bmiTrend = "stable";
  if (lastBMI > firstBMI + 0.5) bmiTrend = "increasing";
  else if (lastBMI < firstBMI - 0.5) bmiTrend = "decreasing";

  // 🔥 risk detection
  let risks = [];

  // BMI risks
  if (avgBMI > 30) risks.push("high_obesity_risk");
  else if (avgBMI > 25) risks.push("overweight_risk");
  else if (avgBMI < 18.5) risks.push("underweight_risk");

  // sudden BMI change
  if (Math.abs(lastBMI - firstBMI) > 1.5) {
    risks.push("rapid_weight_change");
  }

  // BMR anomaly (very low/high fluctuation)
  const bmrVariance =
    Math.max(...bmrValues) - Math.min(...bmrValues);

  if (bmrVariance > 300) {
    risks.push("bmr_instability");
  }

  // TDEE anomaly
  const tdeeVariance =
    Math.max(...tdeeValues) - Math.min(...tdeeValues);

  if (tdeeVariance > 500) {
    risks.push("activity_instability");
  }

  // final status
  let riskLevel = "low";

  if (risks.length >= 3) riskLevel = "high";
  else if (risks.length > 0) riskLevel = "moderate";

  return {
    riskLevel,
    risks,

    metrics: {
      avgBMI,
      avgBMR,
      avgTDEE,
      bmiTrend
    }
  };
}
// create utility functions for monthly day-wise protein and calorie intake and activity score
async function getMonthlyIntakeAndActivity(authId, year, month) {
    // month: 1–12
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const records = await dailyScoreSchema.find({
        authId,
        date: { $gte: startDate, $lte: endDate }    
    });
    // console.log("DailyScore records for month:", records);
    const map = new Map();
    records.forEach(r => {
        map.set(r.date.toDateString(), {
            calorieIntake: r.actualCalories || 0,    
            proteinIntake: r.actualProtein || 0,
            activityScore: r.activityScore || 0
        });
    });
    console.log("Mapped DailyScore records:", map);
    const result = [];
    const totalDays = endDate.getDate();
    for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(year, month - 1, day);
        currentDate.setHours(0, 0, 0, 0);
        const key = currentDate.toDateString();
        const data = map.get(key) || {
            calorieIntake: 0,
            proteinIntake: 0,


            activityScore: 0
        };
        result.push({   
            day,

            date: currentDate,
            calorieIntake: data.calorieIntake,
            proteinIntake: data.proteinIntake,
            activityScore: data.activityScore
        });
    }
    return result;
}
//need to create controller functions that call above utilities and return data in API response format. Also need to create new routes for these controllers.

// create controller functions that call above utilities and return data in API response format. Also need to create new routes for these controllers.
const getStreakData = async (req, res) => {
    try {
        const authId = req.user?._id;
        const { year, month } = req.query;
        if (!authId) {
            return res.status(401).json(new ApiError(401, "Unauthorized"));
        }
        if (!year || !month) {
            return res.status(400).json(new ApiError(400, "Year and month are required"));
        }
        const data = await getMonthlyDayWise(authId, parseInt(year), parseInt(month));
        return res.json(new ApiResponse(200, data));
    } catch (error) {
        console.error("Error in getStreakData:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error while fetching streak data"));
    }
};
const getWeightData = async (req, res) => {
    try {
        const authId = req.user?._id;
        const { year, month } = req.query;
        if (!authId) {
            return res.status(401).json(new ApiError(401, "Unauthorized"));
        }
        if (!year || !month) {
            return res.status(400).json(new ApiError(400, "Year and month are required"));
        }
        const data = await getMonthlyWeight(authId, parseInt(year), parseInt(month));
        return res.json(new ApiResponse(200, data));
    } catch (error) {
        console.error("Error in getWeightData:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error while fetching weight data"));
    } 
};
const getHealthRisk = async (req, res) => {
    try {
        const authId = req.user?._id;
        if (!authId) {
            return res.status(401).json(new ApiError(401, "Unauthorized"));
        }
        const data = await detectHealthRisk(authId);
        return res.json(new ApiResponse(200, data));
    }
    catch (error) {

        console.error("Error in getHealthRisk:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error while detecting health risk"));
    }
};
const getIntakeAndActivity = async (req, res) => {
    try {
        const authId = req.user?._id;
        const { year, month } = req.query;
        if (!authId) {
            return res.status(401).json(new ApiError(401, "Unauthorized"));
        }
        if (!year || !month) {
            return res.status(400).json(new ApiError(400, "Year and month are required"));
        }
        const data = await getMonthlyIntakeAndActivity(authId, parseInt(year), parseInt(month));
        return res.json(new ApiResponse(200, data));
    }
    catch (error) {
        console.error("Error in getIntakeAndActivity:", error);
        res.status(500).json(new ApiError(500, "Internal Server Error while fetching intake and activity data"));
    }
};
export {
    getStreakData,
    getWeightData,
    getHealthRisk,
    getIntakeAndActivity
};
