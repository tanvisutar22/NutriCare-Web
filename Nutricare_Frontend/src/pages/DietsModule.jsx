import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  createDietPlan,
  getDietPlanById,
  listDietPlans,
  updateDietPlanStatus,
} from "../features/diets/dietsApi";
import {
  DEFAULT_CREATE_FORM,
  DIET_STATUS_OPTIONS,
} from "../features/diets/dietsConstants";

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <div
      className={`mt-4 rounded-xl border p-3 text-sm ${styles[variant] || styles.info}`}
    >
      {children}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[status] || "bg-slate-50 text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {status || "unknown"}
    </span>
  );
}

function DietDetailCard({ diet, onClose, onStatusSave, savingStatus }) {
  const [nextStatus, setNextStatus] = useState(diet?.status || "active");

  useEffect(() => {
    setNextStatus(diet?.status || "active");
  }, [diet]);

  if (!diet) return null;

  const meals = Array.isArray(diet?.meals)
    ? diet.meals
    : Array.isArray(diet?.dietPlan)
      ? diet.dietPlan
      : Array.isArray(diet?.plan)
        ? diet.plan
        : [];

  return (
    <div className="card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Diet Plan Detail
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Full details of the selected diet plan for this period.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Plan ID</div>
          <div className="mt-1 break-all text-sm font-medium text-slate-900">
            {diet?._id || "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Status</div>
          <div className="mt-2">
            <StatusBadge status={diet?.status} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Start Date</div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {formatDate(diet?.startDate)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">End Date</div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {formatDate(diet?.endDate)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Created At</div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {formatDateTime(diet?.createdAt)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Updated At</div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {formatDateTime(diet?.updatedAt)}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-900">
          Update Status
        </h4>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              className="input mt-2"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              {DIET_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={savingStatus}
            onClick={() => onStatusSave(diet._id, nextStatus)}
          >
            {savingStatus ? "Saving..." : "Update Status"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-900">Plan Content</h4>

        {meals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No meal array found in response. This is okay if your backend
            returns the plan in another format.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {meals.map((meal, index) => (
              <div
                key={meal?._id || index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-medium text-slate-900">
                  {meal?.mealType ||
                    meal?.title ||
                    meal?.name ||
                    `Meal ${index + 1}`}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {meal?.description ||
                    meal?.food ||
                    meal?.items ||
                    "No extra description"}
                </div>
                {"calories" in (meal || {}) ? (
                  <div className="mt-2 text-sm text-slate-700">
                    Calories: {meal.calories}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {!meals.length && diet?.notes ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {diet.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DietsModule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);

  const [selectedId, setSelectedId] = useState("");
  const [selectedDiet, setSelectedDiet] = useState(null);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  const loadDiets = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listDietPlans();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiets();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.startDate) {
      setError("Start date is required.");
      return;
    }

    if (!createForm.endDate) {
      setError("End date is required.");
      return;
    }

    if (new Date(createForm.endDate) < new Date(createForm.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      };

      const res = await createDietPlan(payload);
      setSuccess(res?.message || "Diet plan created successfully.");
      setCreateForm(DEFAULT_CREATE_FORM);
      await loadDiets();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const onViewDetail = async (id) => {
    if (!id) return;

    setSelectedId(id);
    setSelectedDiet(null);
    setLoadingDetail(true);
    setError("");
    setSuccess("");

    try {
      const res = await getDietPlanById(id);
      setSelectedDiet(res?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  const onStatusSave = async (id, status) => {
    if (!id) return;

    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateDietPlanStatus(id, { status });
      setSuccess(res?.message || "Diet plan status updated.");

      const detailRes = await getDietPlanById(id);
      setSelectedDiet(detailRes?.data || null);

      await loadDiets();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-teal-600">Diet generation</h2>
          <p className="mt-1 text-slate-600">
            Generate daily diet plans based on your profile and body metrics.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadDiets}
          disabled={loading || creating || savingStatus}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">
          Create Diet Plan
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Make sure profile and body metrics are already completed before
          creating a diet plan.
        </p>

        <form
          onSubmit={onCreate}
          className="mt-5 grid gap-4 md:grid-cols-3 items-end"
        >
          <div>
            <label className="text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              className="input mt-2"
              type="date"
              value={createForm.startDate}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              End Date
            </label>
            <input
              className="input mt-2"
              type="date"
              value={createForm.endDate}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>

          <div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Generate Diet Plan"}
            </button>
          </div>
        </form>

        {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
        {success ? (
          <InlineAlert variant="success">{success}</InlineAlert>
        ) : null}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Diet Plans</h3>

        {loading ? (
          <div className="mt-5 text-sm text-slate-700">
            Loading diet plans...
          </div>
        ) : !hasRows ? (
          <div className="mt-5 text-sm text-slate-600">
            No diet plans found. Create one above to get started.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Start Date</th>
                  <th className="py-2 pr-3">End Date</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((diet) => (
                  <tr key={diet?._id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 text-slate-900">
                      {formatDate(diet?.startDate)}
                    </td>
                    <td className="py-3 pr-3 text-slate-900">
                      {formatDate(diet?.endDate)}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={diet?.status} />
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {formatDateTime(diet?.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                        onClick={() => onViewDetail(diet?._id)}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loadingDetail ? (
        <div className="card">
          <div className="text-sm text-slate-700">Loading diet detail...</div>
        </div>
      ) : selectedId && selectedDiet ? (
        <DietDetailCard
          diet={selectedDiet}
          onClose={() => {
            setSelectedId("");
            setSelectedDiet(null);
          }}
          onStatusSave={onStatusSave}
          savingStatus={savingStatus}
        />
      ) : null}
    </div>
  );
}
