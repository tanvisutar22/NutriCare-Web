// import { useState, useEffect } from "react";
// import api from "../api/axios";

// export default function DietLog() {
//   const [dietLog, setDietLog] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Fetch today's diet log on mount
//   useEffect(() => {
//     const fetchTodayLog = async () => {
//       try {
//         const res = await api.get("/dietlog/today");
//         setDietLog(res.data.data);
//       } catch (err) {
//         setError("No diet log found for today");
//       }
//     };
//     fetchTodayLog();
//   }, []);

//   // Generate today's diet log
//   const handleGenerate = async () => {
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       const res = await api.post("/dietlog/generate-today");
//       setDietLog(res.data.data);
//       setSuccess("Today's diet log generated successfully!");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to generate diet log");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update consumed values
//   const handleUpdate = async () => {
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       const res = await api.patch("/dietlog/update", {
//         date: dietLog.date, // ✅ required
//         caloriesConsumed: dietLog.caloriesConsumed + 200,
//         proteinConsumed: dietLog.proteinConsumed + 10,
//       });
//       setDietLog(res.data.data);
//       setSuccess("Diet log updated successfully!");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to update diet log");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Delete today's log
//   const handleDelete = async () => {
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       await api.delete("/dietlog/delete", { data: { date: dietLog.date } });
//       setDietLog(null);
//       setSuccess("Diet log deleted successfully!");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to delete diet log");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto py-8">
//       <h2 className="text-2xl font-semibold text-teal-600 mb-6">Diet Log</h2>

//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       {success && <p className="text-green-500 mb-4">{success}</p>}

//       {!dietLog ? (
//         <div>
//           <p>No diet log for today.</p>
//           <button onClick={handleGenerate} className="btn-primary">
//             {loading ? "Generating..." : "Generate Today's Diet Log"}
//           </button>
//         </div>
//       ) : (
//         <div className="bg-white shadow rounded p-6">
//           <p>
//             <strong>Date:</strong> {new Date(dietLog.date).toLocaleDateString()}
//           </p>
//           <p>
//             <strong>Calorie Target:</strong> {dietLog.calorieTarget} kcal
//           </p>
//           <p>
//             <strong>Protein Target:</strong> {dietLog.proteinTarget} g
//           </p>
//           <p>
//             <strong>Calories Consumed:</strong> {dietLog.caloriesConsumed} kcal
//           </p>
//           <p>
//             <strong>Protein Consumed:</strong> {dietLog.proteinConsumed} g
//           </p>
//           <p>
//             <strong>AI Generated:</strong> {dietLog.aiGenerated ? "Yes" : "No"}
//           </p>

//           <div className="mt-4 space-x-4">
//             <button onClick={handleUpdate} className="btn-primary">
//               {loading ? "Updating..." : "Update Consumed"}
//             </button>
//             <button onClick={handleDelete} className="btn-danger">
//               {loading ? "Deleting..." : "Delete Log"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import api from "../api/axios";

export default function DietLog() {
  const [dietLog, setDietLog] = useState(null);
  const [caloriesConsumed, setCaloriesConsumed] = useState("");
  const [proteinConsumed, setProteinConsumed] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTodayLog();
  }, []);

  const fetchTodayLog = async () => {
    try {
      const res = await api.get("/dietLog/today");
      setDietLog(res.data.data);
    } catch {
      setDietLog(null);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/dietLog/generate-today");
      setDietLog(res.data.data);
      setMessage("Diet log generated successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.patch("/dietLog/update", {
        date: dietLog.date,
        caloriesConsumed: Number(caloriesConsumed),
        proteinConsumed: Number(proteinConsumed),
      });
      setDietLog(res.data.data);
      setMessage("Diet log updated");
      setCaloriesConsumed("");
      setProteinConsumed("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.delete("/dietLog/delete", {
        data: { date: dietLog.date },
      });
      setDietLog(null);
      setMessage("Diet log deleted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold text-teal-600 mb-4">
        Today’s Diet Log
      </h2>

      {message && <p className="mb-4 text-blue-600">{message}</p>}

      {!dietLog ? (
        <button onClick={handleGenerate} className="btn-primary">
          {loading ? "Generating..." : "Generate Today’s Diet"}
        </button>
      ) : (
        <div className="bg-white p-6 shadow rounded space-y-2">
          <p>
            <b>Calories Target:</b> {dietLog.calorieTarget} kcal
          </p>
          <p>
            <b>Protein Target:</b> {dietLog.proteinTarget} g
          </p>
          <p>
            <b>Calories Consumed:</b> {dietLog.caloriesConsumed}
          </p>
          <p>
            <b>Protein Consumed:</b> {dietLog.proteinConsumed}
          </p>

          <input
            className="input"
            placeholder="Calories consumed"
            value={caloriesConsumed}
            onChange={(e) => setCaloriesConsumed(e.target.value)}
          />
          <input
            className="input"
            placeholder="Protein consumed"
            value={proteinConsumed}
            onChange={(e) => setProteinConsumed(e.target.value)}
          />

          <div className="flex gap-3 mt-4">
            <button onClick={handleUpdate} className="btn-primary">
              Update
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
