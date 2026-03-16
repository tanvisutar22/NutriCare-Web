// import { useEffect, useState } from "react";
// import api from "../api/axios";

// export default function Dashboard() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         // const res = await api.get("/user/getUser");
//         // setUser(res.data.data); //here to comment
//         setUser({ email: "Abhishek" }); // Mock user data for testing
//       } catch {
//         setUser(null);
//       }
//     };
//     fetchUser();
//   }, []);

//   return (
//     <div className="px-6 py-12 text-center">
//       {user ? (
//         <>
//           <h2 className="text-3xl font-bold text-teal-600">
//             Welcome, {user.email}
//           </h2>
//           <p className="mt-4">
//             NutriCare AI helps you achieve optimal health with smart nutrition
//             plans.
//           </p>
//         </>
//       ) : (
//         <p>Loading user data...</p>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import api from "../api/axios";

// export default function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [latestWeight, setLatestWeight] = useState(null);
//   const [activeGoal, setActiveGoal] = useState(null);
//   const [dietLog, setDietLog] = useState(null);
//   const [diet, setDiet] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadDashboard();
//   }, []);

//   const loadDashboard = async () => {
//     try {
//       // ✅ User name from localStorage profile (frontend-only)
//       const saved = localStorage.getItem("nutricare_profile");
//       if (saved) {
//         const profile = JSON.parse(saved);
//         setUser({ email: profile.fullName });
//       } else {
//         setUser({ email: "User" });
//       }

//       // ⚖️ Latest weight
//       const metricsRes = await api.get("/variableMetric");
//       const weights = metricsRes.data.data
//         .filter((m) => m.metricType === "weight")
//         .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
//       setLatestWeight(weights[0] || null);

//       // 🎯 Active goal
//       try {
//         const goalRes = await api.get("/goalHistory/active");
//         setActiveGoal(goalRes.data.data);
//       } catch (err) {
//         // No active goal is normal
//         if (err.response?.status !== 404) {
//           console.log("Goal error:", err.response?.status, err.response?.data);
//         }
//         setActiveGoal(null);
//       }

//       // 🍽️ Diet log today
//       try {
//         const logRes = await api.get("/dietLog/today");
//         setDietLog(logRes.data.data);
//       } catch (err) {
//         // No log today is normal
//         if (err.response?.status !== 404) {
//           console.log(
//             "DietLog error:",
//             err.response?.status,
//             err.response?.data,
//           );
//         }
//         setDietLog(null);
//       }

//       // 🥗 Diet today
//       try {
//         const dietRes = await api.get("/diet/today");
//         setDiet(dietRes.data.diet);
//       } catch (err) {
//         const status = err.response?.status;

//         // ✅ If diet not generated today → just show not generated
//         if (status === 404) {
//           setDiet(null);
//         } else {
//           // ✅ If auth issue → you are not logged in
//           console.log("Diet error:", status, err.response?.data);
//           setDiet(null);
//         }
//       }
//     } catch (err) {
//       console.error(
//         "Dashboard load error:",
//         err.response?.status,
//         err.response?.data,
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="p-6">Loading dashboard...</p>;

//   return (
//     <div className="max-w-6xl mx-auto px-6 py-10">
//       {/* Header */}
//       <h2 className="text-3xl font-bold text-teal-600 mb-6">
//         Welcome, {user?.email}
//       </h2>

//       {/* KPI CARDS */}
//       <div className="grid md:grid-cols-4 gap-6 mb-8">
//         <Card
//           title="Latest Weight"
//           value={
//             latestWeight
//               ? `${latestWeight.value} ${latestWeight.unit}`
//               : "No data"
//           }
//         />

//         <Card
//           title="Active Goal"
//           value={
//             activeGoal
//               ? `${activeGoal.goalType} → ${activeGoal.targetWeight} kg`
//               : "No goal"
//           }
//         />

//         <Card
//           title="Today Calories"
//           value={
//             dietLog
//               ? `${dietLog.caloriesConsumed}/${dietLog.calorieTarget}`
//               : "No log"
//           }
//         />

//         <Card title="Diet Plan" value={diet ? "Generated" : "Not generated"} />
//       </div>

//       {/* SECOND ROW */}
//       <div className="grid md:grid-cols-2 gap-6">
//         <InfoCard title="Today Nutrition">
//           {dietLog ? (
//             <>
//               <p>
//                 Calories: {dietLog.caloriesConsumed} / {dietLog.calorieTarget}
//               </p>
//               <p>
//                 Protein: {dietLog.proteinConsumed} / {dietLog.proteinTarget}
//               </p>
//             </>
//           ) : (
//             <p>No nutrition logged today</p>
//           )}
//         </InfoCard>

//         <InfoCard title="Goal Progress">
//           {activeGoal && latestWeight ? (
//             <>
//               <p>Start: {activeGoal.startWeight} kg</p>
//               <p>Current: {latestWeight.value} kg</p>
//               <p>Target: {activeGoal.targetWeight} kg</p>
//             </>
//           ) : (
//             <p>No active goal</p>
//           )}
//         </InfoCard>
//       </div>
//     </div>
//   );
// }

// function Card({ title, value }) {
//   return (
//     <div className="bg-white rounded-xl shadow p-6">
//       <p className="text-gray-500 text-sm">{title}</p>
//       <p className="text-xl font-semibold mt-1">{value}</p>
//     </div>
//   );
// }

// function InfoCard({ title, children }) {
//   return (
//     <div className="bg-white rounded-xl shadow p-6">
//       <p className="text-gray-500 text-sm mb-2">{title}</p>
//       <div className="text-sm space-y-1">{children}</div>
//     </div>
//   );
// }

// import { useEffect, useState, useRef } from "react";
// import api from "../api/axios";

// export default function Dashboard() {
//   const [user, setUser] = useState(null);

//   const [latestWeight, setLatestWeight] = useState(null);
//   const [activeGoal, setActiveGoal] = useState(null);
//   const [dietLog, setDietLog] = useState(null);
//   const [diet, setDiet] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [generatingDiet, setGeneratingDiet] = useState(false);
//   const [msg, setMsg] = useState("");

//   // Prevent duplicate fetch calls in dev (React StrictMode)
//   const didRun = useRef(false);

//   useEffect(() => {
//     if (didRun.current) return;
//     didRun.current = true;
//     loadDashboard();
//   }, []);

//   const loadDashboard = async () => {
//     setLoading(true);
//     setMsg("");

//     try {
//       // ✅ User name from localStorage profile (frontend-only)
//       const saved = localStorage.getItem("nutricare_profile");
//       if (saved) {
//         const profile = JSON.parse(saved);
//         setUser({ email: profile.fullName });
//       } else {
//         setUser({ email: "User" });
//       }

//       // ⚖️ Latest weight
//       try {
//         const metricsRes = await api.get("/variableMetric");
//         const weights = (metricsRes.data.data || [])
//           .filter((m) => m.metricType === "weight")
//           .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
//         setLatestWeight(weights[0] || null);
//       } catch {
//         setLatestWeight(null);
//       }

//       // 🎯 Active goal (404 = no active goal)
//       try {
//         const goalRes = await api.get("/goalHistory/active");
//         setActiveGoal(goalRes.data.data);
//       } catch (err) {
//         if (err.response?.status !== 404) {
//           console.log("Goal error:", err.response?.status, err.response?.data);
//         }
//         setActiveGoal(null);
//       }

//       // 🍽️ Diet log today (404 = no log today)
//       try {
//         const logRes = await api.get("/dietLog/today");
//         setDietLog(logRes.data.data);
//       } catch (err) {
//         if (err.response?.status !== 404) {
//           console.log(
//             "DietLog error:",
//             err.response?.status,
//             err.response?.data,
//           );
//         }
//         setDietLog(null);
//       }

//       // 🥗 Diet today (404 = not generated yet)
//       try {
//         const dietRes = await api.get("/diet/today");
//         setDiet(dietRes.data.diet);
//       } catch (err) {
//         if (err.response?.status === 404) {
//           setDiet(null); // ✅ normal state
//         } else {
//           console.log("Diet error:", err.response?.status, err.response?.data);
//           setDiet(null);
//         }
//       }
//     } catch (err) {
//       console.error("Dashboard load error:", err);
//       setMsg("Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGenerateDiet = async () => {
//     setGeneratingDiet(true);
//     setMsg("");

//     try {
//       // ✅ Your backend expects a message; it decides today/tomorrow.
//       // We nudge it to generate today.
//       await api.post("/diet/generate", { message: "Generate diet for today" });

//       // refetch today's diet
//       const dietRes = await api.get("/diet/today");
//       setDiet(dietRes.data.diet);

//       setMsg("Diet generated successfully!");
//     } catch (err) {
//       setMsg(err.response?.data?.message || "Failed to generate diet");
//     } finally {
//       setGeneratingDiet(false);
//     }
//   };

//   const displayName =
//     user?.email || (user?.email ? user.email.split("@")[0] : "User");

//   if (loading) {
//     return (
//       <div className="max-w-6xl mx-auto px-6 py-10">
//         <p className="text-gray-600">Loading dashboard...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto px-6 py-10">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
//         <div>
//           <h2 className="text-3xl font-bold text-teal-600">
//             Welcome, {displayName}
//           </h2>
//           <p className="text-gray-600 mt-1">
//             NutriCare AI summarizes your health signals, goals, and nutrition
//             for today.
//           </p>
//         </div>

//         <button
//           onClick={loadDashboard}
//           className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium"
//         >
//           Refresh
//         </button>
//       </div>

//       {msg && (
//         <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
//           {msg}
//         </div>
//       )}

//       {/* KPI CARDS */}
//       <div className="grid md:grid-cols-4 gap-6 mb-8">
//         <Card
//           title="Latest Weight"
//           value={
//             latestWeight
//               ? `${latestWeight.value} ${latestWeight.unit || ""}`
//               : "No data"
//           }
//           sub={
//             latestWeight
//               ? `Recorded: ${new Date(latestWeight.recordedAt).toLocaleString()}`
//               : "Add a weight metric to start tracking."
//           }
//         />

//         <Card
//           title="Active Goal"
//           value={activeGoal ? formatGoalType(activeGoal.goalType) : "No goal"}
//           sub={
//             activeGoal
//               ? `Target: ${activeGoal.targetWeight} kg`
//               : "Set a goal to personalize your plan."
//           }
//         />

//         <Card
//           title="Today Calories"
//           value={
//             dietLog
//               ? `${dietLog.caloriesConsumed}/${dietLog.calorieTarget}`
//               : "No log"
//           }
//           sub={
//             dietLog
//               ? "Consumed / Target (kcal)"
//               : "Generate today’s log to track."
//           }
//         />

//         <Card
//           title="Diet Plan"
//           value={diet ? "Generated" : "Not generated"}
//           sub={
//             diet
//               ? "Your meal plan is ready."
//               : "Generate an AI diet plan for today."
//           }
//         />
//       </div>

//       {/* CTA: Generate diet */}
//       {!diet && (
//         <div className="mb-8 bg-teal-50 border border-teal-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//           <div>
//             <p className="font-semibold text-teal-800">
//               No diet plan for today
//             </p>
//             <p className="text-sm text-teal-700 mt-1">
//               Generate your AI diet plan to start meal tracking.
//             </p>
//           </div>

//           <button
//             onClick={handleGenerateDiet}
//             disabled={generatingDiet}
//             className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition font-medium disabled:opacity-60"
//           >
//             {generatingDiet ? "Generating..." : "Generate Diet"}
//           </button>
//         </div>
//       )}

//       {/* SECOND ROW */}
//       <div className="grid md:grid-cols-2 gap-6">
//         <InfoCard title="Today Nutrition">
//           {dietLog ? (
//             <>
//               <StatRow
//                 label="Calories"
//                 value={`${dietLog.caloriesConsumed} / ${dietLog.calorieTarget} kcal`}
//               />
//               <ProgressBar
//                 value={dietLog.caloriesConsumed}
//                 target={dietLog.calorieTarget}
//               />

//               <div className="mt-4" />

//               <StatRow
//                 label="Protein"
//                 value={`${dietLog.proteinConsumed} / ${dietLog.proteinTarget} g`}
//               />
//               <ProgressBar
//                 value={dietLog.proteinConsumed}
//                 target={dietLog.proteinTarget}
//               />
//             </>
//           ) : (
//             <p className="text-gray-600">No nutrition log found for today.</p>
//           )}
//         </InfoCard>

//         <InfoCard title="Goal Progress">
//           {activeGoal && latestWeight ? (
//             <>
//               <StatRow label="Start" value={`${activeGoal.startWeight} kg`} />
//               <StatRow label="Current" value={`${latestWeight.value} kg`} />
//               <StatRow label="Target" value={`${activeGoal.targetWeight} kg`} />
//               <div className="mt-3" />
//               <ProgressBar
//                 value={calcGoalProgress(activeGoal, Number(latestWeight.value))}
//                 target={100}
//                 label="Progress"
//                 isPercent
//               />
//             </>
//           ) : (
//             <p className="text-gray-600">No active goal or weight data.</p>
//           )}
//         </InfoCard>
//       </div>

//       {/* Diet Preview */}
//       {diet && (
//         <div className="mt-8 bg-white rounded-2xl shadow p-6">
//           <h3 className="text-lg font-semibold mb-3">Today’s Meals</h3>

//           <div className="grid md:grid-cols-2 gap-4">
//             {diet.meals?.map((meal, idx) => (
//               <div key={idx} className="border rounded-xl p-4">
//                 <p className="font-medium capitalize">{meal.mealType}</p>
//                 <p className="text-sm text-gray-600 mt-1">
//                   {meal.totalCalories} kcal • {meal.totalProtein}g protein
//                 </p>

//                 <ul className="mt-3 space-y-1 text-sm">
//                   {meal.foods?.slice(0, 4).map((f, i) => (
//                     <li key={i} className="flex justify-between">
//                       <span className="text-gray-700">
//                         {f.name} ({f.quantity})
//                       </span>
//                       <span className="text-gray-500">{f.calories} kcal</span>
//                     </li>
//                   ))}
//                 </ul>

//                 {meal.foods?.length > 4 && (
//                   <p className="text-xs text-gray-500 mt-2">
//                     +{meal.foods.length - 4} more items
//                   </p>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function Card({ title, value, sub }) {
//   return (
//     <div className="bg-white rounded-2xl shadow p-6">
//       <p className="text-gray-500 text-sm">{title}</p>
//       <p className="text-xl font-semibold mt-1">{value}</p>
//       {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
//     </div>
//   );
// }

// function InfoCard({ title, children }) {
//   return (
//     <div className="bg-white rounded-2xl shadow p-6">
//       <p className="text-gray-500 text-sm mb-3">{title}</p>
//       <div className="text-sm space-y-2">{children}</div>
//     </div>
//   );
// }

// function StatRow({ label, value }) {
//   return (
//     <div className="flex items-center justify-between">
//       <span className="text-gray-600">{label}</span>
//       <span className="font-medium">{value}</span>
//     </div>
//   );
// }

// function ProgressBar({ value, target, label, isPercent }) {
//   const safeTarget = target || 1;
//   const pct = Math.min((Number(value) / safeTarget) * 100, 100);

//   return (
//     <div>
//       {label && (
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>{label}</span>
//           <span>
//             {isPercent ? `${Math.round(value)}%` : `${Math.round(pct)}%`}
//           </span>
//         </div>
//       )}
//       <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
//         <div
//           className="h-3 bg-teal-600 rounded-full"
//           style={{ width: `${pct}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// function formatGoalType(type) {
//   if (type === "fat_loss") return "Fat Loss";
//   if (type === "muscle_gain") return "Muscle Gain";
//   return "Maintenance";
// }

// /**
//  * Returns progress percentage (0..100)
//  * For fat_loss: progress increases as current weight approaches target below start
//  * For muscle_gain: progress increases as current weight approaches target above start
//  * For maintenance: keep it simple: 0 if far, 100 if within +-1kg
//  */
// function calcGoalProgress(goal, currentWeight) {
//   const start = Number(goal.startWeight);
//   const target = Number(goal.targetWeight);

//   if (
//     !Number.isFinite(start) ||
//     !Number.isFinite(target) ||
//     !Number.isFinite(currentWeight)
//   ) {
//     return 0;
//   }

//   if (goal.goalType === "maintenance") {
//     const diff = Math.abs(currentWeight - target);
//     return diff <= 1 ? 100 : Math.max(0, 100 - diff * 20);
//   }

//   const total = Math.abs(target - start);
//   const done = Math.abs(currentWeight - start);

//   if (total === 0) return 0;

//   // clamp
//   const pct = (done / total) * 100;

//   // For fat_loss, if user goes opposite direction, show 0
//   if (goal.goalType === "fat_loss" && currentWeight > start) return 0;

//   // For muscle_gain, if user goes opposite direction, show 0
//   if (goal.goalType === "muscle_gain" && currentWeight < start) return 0;

//   return Math.max(0, Math.min(100, Math.round(pct)));
// }

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  const [latestWeight, setLatestWeight] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [dietLog, setDietLog] = useState(null);

  // ✅ We will NOT call /diet/today on initial load to avoid 404 spam.
  // Diet will be fetched only after Generate button.
  const [diet, setDiet] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generatingDiet, setGeneratingDiet] = useState(false);
  const [generatingLog, setGeneratingLog] = useState(false);
  const [msg, setMsg] = useState("");

  // Prevent duplicate calls in dev StrictMode
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setMsg("");

    try {
      // ✅ User name from localStorage profile (frontend-only)
      const saved = localStorage.getItem("nutricare_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        setUser({ email: profile.fullName });
      } else {
        setUser({ email: "User" });
      }

      // ⚖️ Latest weight
      try {
        const metricsRes = await api.get("/variableMetric");
        const weights = (metricsRes.data.data || [])
          .filter((m) => m.metricType === "weight")
          .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
        setLatestWeight(weights[0] || null);
      } catch {
        setLatestWeight(null);
      }

      // 🎯 Active goal (404 = none)
      try {
        const goalRes = await api.get("/goalHistory/active");
        setActiveGoal(goalRes.data.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log("Goal error:", err.response?.status, err.response?.data);
        }
        setActiveGoal(null);
      }

      // 🍽️ Diet log today (404 = none)
      try {
        const logRes = await api.get("/dietLog/today");
        setDietLog(logRes.data.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log(
            "DietLog error:",
            err.response?.status,
            err.response?.data,
          );
        }
        setDietLog(null);
      }

      // ✅ Do NOT fetch diet today on load (prevents 404 spam)
      setDiet(null);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setMsg("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDiet = async () => {
    setGeneratingDiet(true);
    setMsg("");

    try {
      // Generate diet via your backend AI endpoint
      await api.post("/diet/generate", { message: "Generate diet for today" });

      // Now fetch today's diet (should exist)
      const dietRes = await api.get("/diet/today");
      setDiet(dietRes.data.diet);

      setMsg("Diet generated successfully!");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to generate diet");
      setDiet(null);
    } finally {
      setGeneratingDiet(false);
    }
  };

  const handleGenerateDietLog = async () => {
    setGeneratingLog(true);
    setMsg("");

    try {
      await api.post("/dietLog/generate-today");
      const logRes = await api.get("/dietLog/today");
      setDietLog(logRes.data.data);
      setMsg("Diet log generated successfully!");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to generate diet log");
    } finally {
      setGeneratingLog(false);
    }
  };

  const displayName = user?.email || "User";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-teal-600">
            Welcome, {displayName}
          </h2>
          <p className="text-gray-600 mt-1">
            NutriCare AI summarizes your health signals, goals, and nutrition
            for today.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium"
        >
          Refresh
        </button>
      </div>

      {msg && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
          {msg}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card
          title="Latest Weight"
          value={
            latestWeight
              ? `${latestWeight.value} ${latestWeight.unit || ""}`
              : "No data"
          }
          sub={
            latestWeight
              ? `Recorded: ${new Date(latestWeight.recordedAt).toLocaleString()}`
              : "Add a weight metric to start tracking."
          }
        />

        <Card
          title="Active Goal"
          value={activeGoal ? formatGoalType(activeGoal.goalType) : "No goal"}
          sub={
            activeGoal
              ? `Target: ${activeGoal.targetWeight} kg`
              : "Set a goal to personalize your plan."
          }
        />

        <Card
          title="Today Calories"
          value={
            dietLog
              ? `${dietLog.caloriesConsumed}/${dietLog.calorieTarget}`
              : "No log"
          }
          sub={
            dietLog
              ? "Consumed / Target (kcal)"
              : "Generate today’s log to track."
          }
        />

        <Card
          title="Diet Plan"
          value={diet ? "Generated" : "Not generated"}
          sub={
            diet
              ? "Your meal plan is ready."
              : "Generate an AI diet plan for today."
          }
        />
      </div>

      {/* CTA ROW */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Diet Plan CTA */}
        {!diet ? (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-teal-800">
                No diet plan for today
              </p>
              <p className="text-sm text-teal-700 mt-1">
                Generate your AI diet plan to start meal tracking.
              </p>
            </div>
            <button
              onClick={handleGenerateDiet}
              disabled={generatingDiet}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition font-medium disabled:opacity-60"
            >
              {generatingDiet ? "Generating..." : "Generate Diet"}
            </button>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-5 shadow">
            <p className="font-semibold text-gray-800">Diet plan ready ✅</p>
            <p className="text-sm text-gray-600 mt-1">
              Scroll down to view meals.
            </p>
          </div>
        )}

        {/* Diet Log CTA */}
        {!dietLog ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800">
                No diet log for today
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Generate today’s calorie/protein targets to track compliance.
              </p>
            </div>
            <button
              onClick={handleGenerateDietLog}
              disabled={generatingLog}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-black transition font-medium disabled:opacity-60"
            >
              {generatingLog ? "Generating..." : "Generate Log"}
            </button>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-5 shadow">
            <p className="font-semibold text-gray-800">Diet log ready ✅</p>
            <p className="text-sm text-gray-600 mt-1">
              Calories and protein tracking is available.
            </p>
          </div>
        )}
      </div>

      {/* SECOND ROW */}
      <div className="grid md:grid-cols-2 gap-6">
        <InfoCard title="Today Nutrition">
          {dietLog ? (
            <>
              <StatRow
                label="Calories"
                value={`${dietLog.caloriesConsumed} / ${dietLog.calorieTarget} kcal`}
              />
              <ProgressBar
                value={dietLog.caloriesConsumed}
                target={dietLog.calorieTarget}
              />

              <div className="mt-4" />

              <StatRow
                label="Protein"
                value={`${dietLog.proteinConsumed} / ${dietLog.proteinTarget} g`}
              />
              <ProgressBar
                value={dietLog.proteinConsumed}
                target={dietLog.proteinTarget}
              />
            </>
          ) : (
            <p className="text-gray-600">No nutrition log found for today.</p>
          )}
        </InfoCard>

        <InfoCard title="Goal Progress">
          {activeGoal && latestWeight ? (
            <>
              <StatRow label="Start" value={`${activeGoal.startWeight} kg`} />
              <StatRow label="Current" value={`${latestWeight.value} kg`} />
              <StatRow label="Target" value={`${activeGoal.targetWeight} kg`} />
              <div className="mt-3" />
              <ProgressBar
                value={calcGoalProgress(activeGoal, Number(latestWeight.value))}
                target={100}
                label="Progress"
                isPercent
              />
            </>
          ) : (
            <p className="text-gray-600">No active goal or weight data.</p>
          )}
        </InfoCard>
      </div>

      {/* Diet Preview */}
      {diet && (
        <div className="mt-8 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Today’s Meals</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {diet.meals?.map((meal, idx) => (
              <div key={idx} className="border rounded-xl p-4">
                <p className="font-medium capitalize">{meal.mealType}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {meal.totalCalories} kcal • {meal.totalProtein}g protein
                </p>

                <ul className="mt-3 space-y-1 text-sm">
                  {meal.foods?.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-gray-700">
                        {f.name} ({f.quantity})
                      </span>
                      <span className="text-gray-500">{f.calories} kcal</span>
                    </li>
                  ))}
                </ul>

                {meal.foods?.length > 4 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{meal.foods.length - 4} more items
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-gray-500 text-sm mb-3">{title}</p>
      <div className="text-sm space-y-2">{children}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ProgressBar({ value, target, label, isPercent }) {
  const safeTarget = target || 1;
  const pct = Math.min((Number(value) / safeTarget) * 100, 100);

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>
            {isPercent ? `${Math.round(value)}%` : `${Math.round(pct)}%`}
          </span>
        </div>
      )}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-3 bg-teal-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatGoalType(type) {
  if (type === "fat_loss") return "Fat Loss";
  if (type === "muscle_gain") return "Muscle Gain";
  return "Maintenance";
}

function calcGoalProgress(goal, currentWeight) {
  const start = Number(goal.startWeight);
  const target = Number(goal.targetWeight);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(target) ||
    !Number.isFinite(currentWeight)
  ) {
    return 0;
  }

  if (goal.goalType === "maintenance") {
    const diff = Math.abs(currentWeight - target);
    return diff <= 1 ? 100 : Math.max(0, 100 - diff * 20);
  }

  const total = Math.abs(target - start);
  if (total === 0) return 0;

  const done = Math.abs(currentWeight - start);
  const pct = (done / total) * 100;

  if (goal.goalType === "fat_loss" && currentWeight > start) return 0;
  if (goal.goalType === "muscle_gain" && currentWeight < start) return 0;

  return Math.max(0, Math.min(100, Math.round(pct)));
}
