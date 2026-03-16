// import { useState, useEffect } from "react";
// import api from "../api/axios";

// export default function VariableMetrics() {
//   const [metrics, setMetrics] = useState([]);
//   const [formData, setFormData] = useState({
//     metricType: "weight",
//     value: "",
//     unit: "kg",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // Fetch metrics on mount
//   useEffect(() => {
//     const fetchMetrics = async () => {
//       try {
//         const res = await api.get("/variableMetric");
//         setMetrics(res.data.data);
//       } catch (err) {
//         setError("Failed to fetch metrics");
//       }
//     };
//     fetchMetrics();
//   }, []);

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       const res = await api.post("/variableMetric/create", formData);
//       setSuccess("Metric created successfully!");
//       setMetrics((prev) => [res.data.data, ...prev]); // add new metric to list
//       setFormData({ metricType: "weight", value: "", unit: "kg" }); // reset form
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to create metric");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto py-8">
//       <h2 className="text-2xl font-semibold text-teal-600 mb-6">
//         Variable Metrics
//       </h2>

//       {/* Form */}
//       <form
//         onSubmit={handleSubmit}
//         className="space-y-4 bg-white shadow rounded p-6 mb-6"
//       >
//         <select
//           name="metricType"
//           value={formData.metricType}
//           onChange={handleChange}
//           className="input"
//         >
//           <option value="weight">Weight</option>
//           <option value="activity_level">Activity Level</option>
//           <option value="symptom">Symptom</option>
//           <option value="lifestyle_change">Lifestyle Change</option>
//         </select>

//         <input
//           name="value"
//           value={formData.value}
//           onChange={handleChange}
//           className="input"
//           placeholder="Value"
//         />

//         <input
//           name="unit"
//           value={formData.unit}
//           onChange={handleChange}
//           className="input"
//           placeholder="Unit (e.g., kg, steps)"
//         />

//         <button type="submit" className="btn-primary">
//           {loading ? "Saving..." : "Add Metric"}
//         </button>
//       </form>

//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       {success && <p className="text-green-500 mb-4">{success}</p>}

//       {/* Metrics List */}
//       <div className="bg-gray-50 shadow rounded p-6">
//         <h3 className="text-lg font-semibold mb-4">Recorded Metrics</h3>
//         {metrics.length === 0 ? (
//           <p>No metrics recorded yet.</p>
//         ) : (
//           <ul className="space-y-2">
//             {metrics.map((metric) => (
//               <li key={metric._id} className="border-b pb-2">
//                 <strong>{metric.metricType}</strong>: {metric.value}{" "}
//                 {metric.unit}
//                 <span className="text-sm text-gray-500">
//                   {" "}
//                   ({new Date(metric.recordedAt).toLocaleString()})
//                 </span>
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

export default function VariableMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [metricType, setMetricType] = useState("weight");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMetrics();
  }, []);

  // 🔥 AUTO SET UNIT BASED ON METRIC TYPE
  useEffect(() => {
    if (metricType === "weight") setUnit("kg");
    else if (metricType === "activity_level") setUnit("level");
    else setUnit(""); // symptom, lifestyle
  }, [metricType]);

  const loadMetrics = async () => {
    const res = await api.get("/variableMetric");
    setMetrics(res.data.data);
  };

  const addMetric = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/variableMetric/create", {
        metricType,
        value,
        unit,
      });
      setMetrics((prev) => [res.data.data, ...prev]);
      setValue("");
      setMessage("Metric added successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add metric");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold text-teal-600 mb-4">
        Health Metrics
      </h2>

      <form onSubmit={addMetric} className="card space-y-3">
        <select
          className="input"
          value={metricType}
          onChange={(e) => setMetricType(e.target.value)}
        >
          <option value="weight">Weight</option>
          <option value="activity_level">Activity Level</option>
          <option value="symptom">Symptom</option>
          <option value="lifestyle_change">Lifestyle Change</option>
        </select>

        <input
          className="input"
          placeholder={
            metricType === "weight" ? "Enter weight" : "Enter description"
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        {/* 🔥 SHOW UNIT ONLY WHEN REQUIRED */}
        {unit && <input className="input bg-gray-100" value={unit} disabled />}

        <button className="btn-primary">Add Metric</button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <div className="card mt-6 space-y-2">
        {metrics.map((m) => (
          <p key={m._id}>
            <b>{m.metricType}</b>: {m.value}
            {m.unit && ` ${m.unit}`} — {new Date(m.recordedAt).toLocaleString()}
          </p>
        ))}
      </div>
    </div>
  );
}
