import { useEffect, useMemo, useState } from "react";
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

const initialCreate = {
  metricType: "weight",
  value: "",
  recordedAt: "",
};

function formatDateTime(dt) {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function MetricTypeBadge({ metricType }) {
  const styles = {
    weight: "bg-teal-50 text-teal-800 border-teal-200",
    activityLevel: "bg-indigo-50 text-indigo-800 border-indigo-200",
    bmi: "bg-amber-50 text-amber-800 border-amber-200",
    bmr: "bg-emerald-50 text-emerald-800 border-emerald-200",
    tdee: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        styles[metricType] || "bg-gray-50 text-gray-700 border-gray-200",
      ].join(" ")}
    >
      {metricType}
    </span>
  );
}

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={`mt-4 border rounded-xl p-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

export default function BodyMetricsModule() {
  const [filterMetricType, setFilterMetricType] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState(initialCreate);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editRecordedAt, setEditRecordedAt] = useState("");

  const metricTypeLabel = useMemo(() => {
    const found = METRIC_TYPE_OPTIONS.find((o) => o.value === filterMetricType);
    return found?.label || "All";
  }, [filterMetricType]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listBodyMetrics({ metricType: filterMetricType || undefined });
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMetricType]);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.metricType) {
      setError("metricType is required");
      return;
    }
    if (String(createForm.value).trim() === "") {
      setError("value is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        metricType: createForm.metricType,
        value:
          createForm.metricType === "weight" ||
          createForm.metricType === "bmi" ||
          createForm.metricType === "bmr" ||
          createForm.metricType === "tdee"
            ? Number(createForm.value)
            : createForm.value,
        recordedAt: createForm.recordedAt ? new Date(createForm.recordedAt).toISOString() : undefined,
      };

      const res = await createBodyMetric(payload);
      setSuccess(res?.message || "Metric created.");

      // Backend may recalculate derived metrics; refresh list.
      setCreateForm((p) => ({ ...p, value: "", recordedAt: "" }));
      await load();
    } catch (e2) {
      setError(getApiErrorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (m) => {
    setEditingId(m?._id);
    setEditValue(m?.value ?? "");
    // For datetime-local input: convert to YYYY-MM-DDTHH:mm
    const d = m?.recordedAt ? new Date(m.recordedAt) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, "0");
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours(),
      )}:${pad(d.getMinutes())}`;
      setEditRecordedAt(local);
    } else {
      setEditRecordedAt("");
    }
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
    setEditRecordedAt("");
  };

  const saveEdit = async (m) => {
    setError("");
    setSuccess("");
    if (!m?._id) return;

    if (String(editValue).trim() === "") {
      setError("value is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        value:
          m.metricType === "weight" ||
          m.metricType === "bmi" ||
          m.metricType === "bmr" ||
          m.metricType === "tdee"
            ? Number(editValue)
            : editValue,
        recordedAt: editRecordedAt ? new Date(editRecordedAt).toISOString() : undefined,
      };
      const res = await updateBodyMetric(m._id, payload);
      setSuccess(res?.message || "Metric updated.");
      cancelEdit();
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (m) => {
    setError("");
    setSuccess("");
    if (!m?._id) return;

    const ok = window.confirm("Delete this metric?");
    if (!ok) return;

    setSaving(true);
    try {
      const res = await deleteBodyMetric(m._id);
      setSuccess(res?.message || "Metric deleted.");
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-teal-600">Body metrics</h2>
          <p className="text-slate-600 mt-1">
            Track your weight and activity. We’ll automatically keep BMI, BMR and TDEE in sync.
          </p>
        </div>

        <div className="w-full md:w-64">
          <label className="text-sm text-slate-700 font-medium">Filter by type</label>
          <select
            className="input mt-2"
            value={filterMetricType}
            onChange={(e) => setFilterMetricType(e.target.value)}
          >
            {METRIC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Create */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Add a metric</h3>
        <p className="text-sm text-slate-600 mt-1">
          Adding <span className="font-medium">weight</span> or{" "}
          <span className="font-medium">activityLevel</span> will trigger backend recalculation of{" "}
          <span className="font-medium">BMI/BMR/TDEE</span>.
        </p>

        <form onSubmit={onCreate} className="mt-5 grid gap-4 md:grid-cols-4 items-end">
          <div className="md:col-span-1">
            <label className="text-sm text-slate-700 font-medium">Metric type</label>
            <select
              className="input mt-2"
              value={createForm.metricType}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, metricType: e.target.value }))
              }
            >
              {METRIC_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="text-sm text-slate-700 font-medium">Value</label>
            {createForm.metricType === "activityLevel" ? (
              <select
                className="input mt-2"
                value={createForm.value}
                onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))}
              >
                <option value="">Select activity</option>
                {ACTIVITY_LEVEL_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input mt-2"
                type="number"
                value={createForm.value}
                onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="Enter number"
                step="any"
              />
            )}
          </div>

          <div className="md:col-span-1">
            <label className="text-sm text-slate-700 font-medium">Recorded at (optional)</label>
            <input
              className="input mt-2"
              type="datetime-local"
              value={createForm.recordedAt}
              onChange={(e) => setCreateForm((p) => ({ ...p, recordedAt: e.target.value }))}
            />
          </div>

          <div className="md:col-span-1">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add metric"}
            </button>
          </div>
        </form>

        {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
        {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}
      </div>

      {/* List */}
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Metrics {filterMetricType ? `(${metricTypeLabel})` : ""}
          </h3>
          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            disabled={loading || saving}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="mt-5 text-sm text-slate-700">Loading metrics…</div>
        ) : rows.length === 0 ? (
          <div className="mt-5 text-sm text-slate-600">
            No metrics found. Add one above to get started.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Value</th>
                  <th className="py-2 pr-3">Recorded</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const isEditing = editingId === m._id;
                  return (
                    <tr key={m._id} className="border-t border-slate-100">
                      <td className="py-3 pr-3">
                        <MetricTypeBadge metricType={m.metricType} />
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          m.metricType === "activityLevel" ? (
                            <select
                              className="input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            >
                              <option value="">Select activity</option>
                              {ACTIVITY_LEVEL_PRESETS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="input"
                              type="number"
                              step="any"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                          )
                        ) : (
                          <span className="text-slate-900">{String(m.value)}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <input
                            className="input"
                            type="datetime-local"
                            value={editRecordedAt}
                            onChange={(e) => setEditRecordedAt(e.target.value)}
                          />
                        ) : (
                          <span className="text-slate-600">
                            {formatDateTime(m.recordedAt) || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition font-medium disabled:opacity-60"
                              onClick={() => saveEdit(m)}
                              disabled={saving}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium"
                              onClick={() => beginEdit(m)}
                              disabled={saving}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 transition font-medium"
                              onClick={() => onDelete(m)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
