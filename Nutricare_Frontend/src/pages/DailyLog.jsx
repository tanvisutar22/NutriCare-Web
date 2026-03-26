import { useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import { submitDailyLog } from "../features/ai/aiApi";

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={`mt-4 rounded-xl border p-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

export default function DailyLog() {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async () => {
    const text = input.trim();
    if (!text) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await submitDailyLog(text);
      setSuccess(res?.message || "Saved successfully.");
      setInput("");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Daily log</h2>
        <p className="mt-1 text-slate-600">
          Log meals and activities in one message. We’ll extract and save them for today.
        </p>
      </div>

      <div className="card">
        <label className="text-sm font-medium text-slate-700">
          What did you eat / what activity did you do?
        </label>
        <textarea
          className="input mt-2 min-h-40"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Example: "Breakfast: 2 boiled eggs and 1 banana. Walked 30 minutes. Lunch: paneer salad."'
        />

        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={submit} disabled={saving || !input.trim()}>
            {saving ? "Saving..." : "Submit log"}
          </button>
          <button className="btn-secondary" type="button" onClick={() => setInput("")} disabled={saving}>
            Clear
          </button>
        </div>

        {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
        {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}
      </div>
    </div>
  );
}

