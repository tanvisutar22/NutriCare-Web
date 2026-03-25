export function sortMetricsByDate(metrics = []) {
  return [...metrics].sort((a, b) => {
    const aTime = new Date(a?.recordedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.recordedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export function getLatestMetricsMap(metrics = []) {
  return sortMetricsByDate(metrics).reduce((acc, metric) => {
    if (!acc[metric.metricType]) {
      acc[metric.metricType] = metric;
    }
    return acc;
  }, {});
}

export function getMetricUnit(metricType) {
  const units = {
    weight: "kg",
    bmi: "",
    bmr: "kcal",
    tdee: "kcal",
    activityLevel: "",
  };
  return units[metricType] || "";
}
