import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import {
  createBodyMetric,
  deleteBodyMetric,
  listBodyMetrics,
  updateBodyMetric,
} from "../features/bodyMetrics/bodyMetricsApi";
import {
  ACTIVITY_LEVEL_PRESETS,
  METRIC_TYPE_OPTIONS,
} from "../features/bodyMetrics/bodyMetricsConstants";
import {
  getLatestMetricsMap,
  getMetricUnit,
  sortMetricsByDate,
} from "../features/bodyMetrics/bodyMetricsHelpers";

const createState = {
  metricType: "weight",
  value: "",
  recordedAt: "",
};

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
}

export default function BodyMetricsModule() {
  const [metrics, setMetrics] = useState([]);
  const [filterMetricType, setFilterMetricType] = useState("");
  const [createForm, setCreateForm] = useState(createState);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ value: "", recordedAt: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMetrics() {
    setLoading(true);
    setError("");

    try {
      const res = await listBodyMetrics();
      setMetrics(Array.isArray(res?.data) ? res.data : []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  const sortedMetrics = useMemo(() => sortMetricsByDate(metrics), [metrics]);
  const latestByType = useMemo(() => getLatestMetricsMap(metrics), [metrics]);
  const filteredMetrics = useMemo(() => {
    if (!filterMetricType) return sortedMetrics;
    return sortedMetrics.filter((item) => item.metricType === filterMetricType);
  }, [filterMetricType, sortedMetrics]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.metricType || String(createForm.value).trim() === "") {
      setError("Metric type and value are required.");
      return;
    }

    setSaving(true);

    try {
      await createBodyMetric({
        metricType: createForm.metricType,
        value:
          createForm.metricType === "activityLevel"
            ? createForm.value
            : Number(createForm.value),
        recordedAt: createForm.recordedAt
          ? new Date(createForm.recordedAt).toISOString()
          : undefined,
      });

      setCreateForm(createState);
      setSuccess("Metric saved. Backend recalculation updates derived metrics.");
      await loadMetrics();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (metric) => {
    setEditingId(metric._id);
    setEditForm({
      value: String(metric.value ?? ""),
      recordedAt: metric.recordedAt ? new Date(metric.recordedAt).toISOString().slice(0, 16) : "",
    });
  };

  const handleSaveEdit = async (metric) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateBodyMetric(metric._id, {
        value:
          metric.metricType === "activityLevel"
            ? editForm.value
            : Number(editForm.value),
        recordedAt: editForm.recordedAt
          ? new Date(editForm.recordedAt).toISOString()
          : undefined,
      });
      setEditingId("");
      setSuccess("Metric updated successfully.");
      await loadMetrics();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this metric?");
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await deleteBodyMetric(id);
      setSuccess("Metric deleted.");
      await loadMetrics();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600">
            Body Metrics
          </p>
          <h1 className="section-title mt-2">Track the signals that drive your diet</h1>
          <p className="section-copy">
            Add weight and activity level to unlock automatic BMI, BMR, and TDEE
            calculation from your backend.
          </p>
        </div>
        <Link to="/diets" className="btn-secondary">
          Next: Diet plans
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="card">
            <div className="grid gap-4 md:grid-cols-5">
              {["weight", "activityLevel", "bmi", "bmr", "tdee"].map((type) => {
                const metric = latestByType[type];
                const unit = getMetricUnit(type);
                return (
                  <div key={type} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{type}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {metric ? `${metric.value}${unit ? ` ${unit}` : ""}` : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {metric ? formatDateTime(metric.recordedAt) : "No data yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Add new metric</h2>
            <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Metric type</label>
                <select
                  className="input mt-2"
                  value={createForm.metricType}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      metricType: event.target.value,
                      value: "",
                    }))
                  }
                >
                  {METRIC_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Value</label>
                {createForm.metricType === "activityLevel" ? (
                  <select
                    className="input mt-2"
                    value={createForm.value}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, value: event.target.value }))
                    }
                  >
                    <option value="">Select activity level</option>
                    {ACTIVITY_LEVEL_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input mt-2"
                    type="number"
                    step="any"
                    value={createForm.value}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, value: event.target.value }))
                    }
                    placeholder="Enter value"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Recorded at</label>
                <input
                  className="input mt-2"
                  type="datetime-local"
                  value={createForm.recordedAt}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, recordedAt: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full" disabled={saving}>
                  {saving ? "Saving..." : "Add metric"}
                </button>
              </div>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Metric history</h2>
                <p className="mt-1 text-sm text-slate-500">
                  The dashboard logic uses latest-by-type transformation instead of
                  assuming one combined metric object.
                </p>
              </div>
              <select
                className="input max-w-xs"
                value={filterMetricType}
                onChange={(event) => setFilterMetricType(event.target.value)}
              >
                {METRIC_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Value</th>
                    <th className="px-3 py-3">Recorded</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.map((metric) => {
                    const isEditing = editingId === metric._id;
                    return (
                      <tr key={metric._id} className="border-b border-slate-100">
                        <td className="px-3 py-4 font-medium text-slate-900">
                          {metric.metricType}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {isEditing ? (
                            metric.metricType === "activityLevel" ? (
                              <select
                                className="input"
                                value={editForm.value}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    value: event.target.value,
                                  }))
                                }
                              >
                                {ACTIVITY_LEVEL_PRESETS.map((preset) => (
                                  <option key={preset.value} value={preset.value}>
                                    {preset.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="input"
                                type="number"
                                step="any"
                                value={editForm.value}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    value: event.target.value,
                                  }))
                                }
                              />
                            )
                          ) : (
                            `${metric.value}${getMetricUnit(metric.metricType) ? ` ${getMetricUnit(metric.metricType)}` : ""}`
                          )}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {isEditing ? (
                            <input
                              className="input"
                              type="datetime-local"
                              value={editForm.recordedAt}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  recordedAt: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            formatDateTime(metric.recordedAt)
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handleSaveEdit(metric)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setEditingId("")}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => beginEdit(metric)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleDelete(metric._id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!loading && filteredMetrics.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-slate-500">
                  No metrics found for the selected filter.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">How NutriCare uses metrics</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Weight updates help the backend calculate BMI and BMR.</li>
              <li>Activity level helps resolve TDEE used in diet generation.</li>
              <li>Derived metrics are stored separately, then surfaced here.</li>
            </ul>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Quick reminders</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Add weight first for meaningful calculations.</p>
              <p>Use activity level presets so the backend can map factors correctly.</p>
              <p>Derived metrics should not be typed manually unless you are testing.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
