// import { useEffect, useState } from "react";
// import api from "../api/axios";
// import {
//   Chart as ChartJS,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Line } from "react-chartjs-2";

// ChartJS.register(
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
// );

// export default function MetricCharts() {
//   const [weightData, setWeightData] = useState([]);

//   useEffect(() => {
//     const fetchMetrics = async () => {
//       try {
//         const res = await api.get("/variableMetric");

//         // ✅ filter only weight metrics
//         const weights = res.data.data
//           .filter((m) => m.metricType === "weight")
//           .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

//         setWeightData(weights);
//       } catch (err) {
//         console.error("Failed to fetch metrics");
//       }
//     };

//     fetchMetrics();
//   }, []);

//   const chartData = {
//     labels: weightData.map((m) => new Date(m.recordedAt).toLocaleDateString()),
//     datasets: [
//       {
//         label: "Weight (kg)",
//         data: weightData.map((m) => Number(m.value)),
//         borderColor: "#0d9488",
//         backgroundColor: "rgba(13,148,136,0.2)",
//         tension: 0.4,
//         fill: true,
//         pointRadius: 4,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: { display: true },
//     },
//     scales: {
//       y: {
//         beginAtZero: false,
//         title: {
//           display: true,
//           text: "Weight (kg)",
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: "Date",
//         },
//       },
//     },
//   };

//   return (
//     <div className="max-w-4xl mx-auto py-8">
//       <h2 className="text-2xl font-semibold text-teal-600 mb-6">
//         Weight Progress Chart
//       </h2>

//       {weightData.length === 0 ? (
//         <p>No weight data available.</p>
//       ) : (
//         <div className="bg-white shadow rounded p-6">
//           <Line data={chartData} options={options} />
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler, // ✅ ADD THIS
} from "chart.js";
import { Line } from "react-chartjs-2";

// ✅ REGISTER Filler plugin
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

export default function MetricCharts() {
  const [weightData, setWeightData] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get("/variableMetric");

        const weights = (res.data.data || [])
          .filter((m) => m.metricType === "weight")
          .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

        setWeightData(weights);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };

    fetchMetrics();
  }, []);

  const chartData = {
    labels: weightData.map((m) => new Date(m.recordedAt).toLocaleDateString()),
    datasets: [
      {
        label: "Weight (kg)",
        data: weightData.map((m) => Number(m.value)),
        borderColor: "#0d9488",
        backgroundColor: "rgba(13,148,136,0.2)",
        tension: 0.4,
        fill: true, // ✅ now works
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "Weight (kg)" },
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-semibold text-teal-600 mb-6">
        Weight Progress Chart
      </h2>

      {weightData.length === 0 ? (
        <p>No weight data available.</p>
      ) : (
        <div className="bg-white shadow rounded p-6">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
