// import { useState, useEffect } from "react";
// import api from "../api/axios";

// export default function GoalHistory() {
//   const [activeGoal, setActiveGoal] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [formData, setFormData] = useState({
//     goalType: "fat_loss",
//     targetWeight: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [hasWeightMetric, setHasWeightMetric] = useState(false);

//   // Fetch active goal, history, and check weight metric
//   useEffect(() => {
//     const fetchGoals = async () => {
//       try {
//         const activeRes = await api.get("/goalhistory/active");
//         setActiveGoal(activeRes.data.data);
//       } catch (err) {
//         console.warn("No active goal found");
//       }

//       try {
//         const historyRes = await api.get("/goalhistory/history");
//         setHistory(historyRes.data.data);
//       } catch (err) {
//         console.error(
//           "Failed to fetch history:",
//           err.response?.data || err.message,
//         );
//       }

//       try {
//         const metricsRes = await api.get("/variableMetric");
//         const hasWeight = metricsRes.data.data.some(
//           (m) => m.metricType === "weight",
//         );
//         setHasWeightMetric(hasWeight);
//       } catch (err) {
//         console.error(
//           "Failed to fetch metrics:",
//           err.response?.data || err.message,
//         );
//       }
//     };
//     fetchGoals();
//   }, []);

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   // Create new goal
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");
//     try {
//       const res = await api.post("/goalhistory/create", {
//         goalType: formData.goalType,
//         targetWeight: Number(formData.targetWeight),
//       });
//       setActiveGoal(res.data.data);
//       setMessage("New goal created successfully!");
//     } catch (err) {
//       setMessage(err.response?.data?.message || "Failed to create goal");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // End active goal
//   const handleEnd = async () => {
//     setLoading(true);
//     setMessage("");
//     try {
//       const res = await api.patch("/goalhistory/end");
//       setActiveGoal(null);
//       setMessage("Active goal ended successfully!");
//       setHistory((prev) => [...prev, res.data.data]);
//     } catch (err) {
//       setMessage(err.response?.data?.message || "Failed to end goal");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto py-8">
//       <h2 className="text-2xl font-semibold text-teal-600 mb-6">
//         Goal History
//       </h2>

//       {message && <p className="mb-4 text-blue-600">{message}</p>}

//       {/* Active Goal */}
//       {activeGoal ? (
//         <div className="bg-white shadow rounded p-6 mb-6">
//           <h3 className="text-lg font-semibold">Active Goal</h3>
//           <p>
//             <strong>Type:</strong> {activeGoal.goalType}
//           </p>
//           <p>
//             <strong>Target Weight:</strong> {activeGoal.targetWeight} kg
//           </p>
//           <p>
//             <strong>Start Weight:</strong> {activeGoal.startWeight} kg
//           </p>
//           <p>
//             <strong>Weekly Change:</strong> {activeGoal.weeklyTargetChange} kg
//           </p>
//           <p>
//             <strong>Started At:</strong>{" "}
//             {new Date(activeGoal.startedAt).toLocaleDateString()}
//           </p>
//           <button onClick={handleEnd} className="btn-danger mt-4">
//             {loading ? "Ending..." : "End Goal"}
//           </button>
//         </div>
//       ) : (
//         <form
//           onSubmit={handleCreate}
//           className="bg-white shadow rounded p-6 mb-6 space-y-4"
//         >
//           <h3 className="text-lg font-semibold">Create New Goal</h3>
//           <select
//             name="goalType"
//             value={formData.goalType}
//             onChange={handleChange}
//             className="input"
//           >
//             <option value="fat_loss">Fat Loss</option>
//             <option value="muscle_gain">Muscle Gain</option>
//             <option value="maintenance">Maintenance</option>
//           </select>
//           <input
//             name="targetWeight"
//             value={formData.targetWeight}
//             onChange={handleChange}
//             className="input"
//             placeholder="Target Weight (kg)"
//             type="number"
//           />
//           <button
//             type="submit"
//             className="btn-primary"
//             disabled={!hasWeightMetric}
//           >
//             {loading ? "Creating..." : "Create Goal"}
//           </button>
//           {!hasWeightMetric && (
//             <p className="text-red-500 text-sm mt-2">
//               You must record a weight metric before creating a goal.
//             </p>
//           )}
//         </form>
//       )}

//       {/* Goal History */}
//       <div className="bg-gray-50 shadow rounded p-6">
//         <h3 className="text-lg font-semibold mb-4">Past Goals</h3>
//         {history.length === 0 ? (
//           <p>No past goals yet.</p>
//         ) : (
//           <ul className="space-y-2">
//             {history.map((goal) => (
//               <li key={goal._id} className="border-b pb-2">
//                 <strong>{goal.goalType}</strong> — Target: {goal.targetWeight}{" "}
//                 kg, Started: {new Date(goal.startedAt).toLocaleDateString()},
//                 Ended:{" "}
//                 {goal.endedAt
//                   ? new Date(goal.endedAt).toLocaleDateString()
//                   : "Active"}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import api from "../api/axios";

export default function GoalHistory() {
  const [activeGoal, setActiveGoal] = useState(null);
  const [history, setHistory] = useState([]);
  const [goalType, setGoalType] = useState("fat_loss");
  const [targetWeight, setTargetWeight] = useState("");
  const [hasWeightMetric, setHasWeightMetric] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const active = await api.get("/goalHistory/active");
      setActiveGoal(active.data.data);
    } catch {}

    const historyRes = await api.get("/goalHistory/history");
    setHistory(historyRes.data.data);

    const metrics = await api.get("/variableMetric");
    setHasWeightMetric(
      metrics.data.data.some((m) => m.metricType === "weight"),
    );
  };

  const createGoal = async () => {
    try {
      const res = await api.post("/goalHistory/create", {
        goalType,
        targetWeight: Number(targetWeight),
      });
      setActiveGoal(res.data.data);
      setMessage("Goal created");
    } catch (err) {
      setMessage(err.response?.data?.message || "Create failed");
    }
  };

  const endGoal = async () => {
    const res = await api.patch("/goalHistory/end");
    setActiveGoal(null);
    setHistory((prev) => [res.data.data, ...prev]);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4 text-teal-600">Goals</h2>

      {message && <p className="mb-3">{message}</p>}

      {activeGoal ? (
        <div className="card">
          <p>
            <b>Goal:</b> {activeGoal.goalType}
          </p>
          <p>
            <b>Target:</b> {activeGoal.targetWeight} kg
          </p>
          <button onClick={endGoal} className="btn-danger mt-3">
            End Goal
          </button>
        </div>
      ) : (
        <div className="card space-y-3">
          <select
            className="input"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
          >
            <option value="fat_loss">Fat Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <input
            className="input"
            placeholder="Target Weight"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />

          <button
            disabled={!hasWeightMetric}
            onClick={createGoal}
            className="btn-primary"
          >
            Create Goal
          </button>

          {!hasWeightMetric && (
            <p className="text-red-500 text-sm">Add weight metric first</p>
          )}
        </div>
      )}
    </div>
  );
}
