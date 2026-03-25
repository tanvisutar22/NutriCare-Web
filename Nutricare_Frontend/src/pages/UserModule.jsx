import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import { createUserProfile, getMyProfile, updateMyProfile } from "../features/user/userApi";
import {
  ALLERGY_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  GENDER_OPTIONS,
  MEDICAL_CONDITION_OPTIONS,
} from "../features/user/userConstants";

const initialForm = {
  name: "",
  gender: "",
  age: "",
  height: "",
  foodPreference: "",
  medicalConditions: [],
  allergies: [],
};

function toggleItem(items, value) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(toggleItem(value, option.value))}
            className={[
              "rounded-full border px-4 py-2 text-sm transition",
              active
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function UserModule() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const res = await getMyProfile();
        if (!active) return;

        const data = res?.data || {};
        setProfileExists(true);
        setForm({
          name: data.name || "",
          gender: data.gender || "",
          age: data.age ?? "",
          height: data.height ?? "",
          foodPreference: data.foodPreference || "",
          medicalConditions: Array.isArray(data.medicalConditions)
            ? data.medicalConditions
            : data.medicalConditions
              ? [String(data.medicalConditions)]
              : [],
          allergies: Array.isArray(data.allergies)
            ? data.allergies
            : data.allergies
              ? [String(data.allergies)]
              : [],
        });
      } catch (loadError) {
        if (!active) return;

        if (loadError?.response?.status === 404) {
          setProfileExists(false);
          setForm(initialForm);
        } else {
          setError(getApiErrorMessage(loadError));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const validationErrors = useMemo(() => {
    const issues = [];
    if (!form.name.trim()) issues.push("Name is required");
    if (!form.gender) issues.push("Gender is required");
    if (!String(form.age).trim()) issues.push("Age is required");
    if (!String(form.height).trim()) issues.push("Height is required");
    if (!form.foodPreference) issues.push("Food preference is required");
    if (form.medicalConditions.length === 0) {
      issues.push("Select at least one medical condition");
    }
    if (form.allergies.length === 0) {
      issues.push("Select at least one allergy");
    }
    return issues;
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        gender: form.gender,
        age: Number(form.age),
        height: Number(form.height),
        foodPreference: form.foodPreference,
        medicalConditions: form.medicalConditions,
        allergies: form.allergies,
      };

      const response = profileExists
        ? await updateMyProfile(payload)
        : await createUserProfile(payload);

      setProfileExists(true);
      setSuccess(response?.message || "Profile saved successfully.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
                Profile Module
              </p>
              <h1 className="section-title mt-2">Build your health identity</h1>
              <p className="section-copy">
                NutriCare uses your saved profile to personalize food filtering,
                metric calculations, and diet generation.
              </p>
            </div>
            <Link to="/metrics" className="btn-secondary">
              Next: Metrics
            </Link>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  className="input mt-2"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select
                  className="input mt-2"
                  value={form.gender}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, gender: event.target.value }))
                  }
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Age</label>
                <input
                  type="number"
                  min="1"
                  className="input mt-2"
                  value={form.age}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, age: event.target.value }))
                  }
                  placeholder="Years"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  className="input mt-2"
                  value={form.height}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, height: event.target.value }))
                  }
                  placeholder="Centimeters"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Food preference
                </label>
                <select
                  className="input mt-2"
                  value={form.foodPreference}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      foodPreference: event.target.value,
                    }))
                  }
                >
                  <option value="">Select preference</option>
                  {FOOD_PREFERENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Medical conditions
                </label>
                <span className="text-xs text-slate-400">
                  Send only backend-supported values
                </span>
              </div>
              <div className="mt-3">
                <ChipGroup
                  options={MEDICAL_CONDITION_OPTIONS}
                  value={form.medicalConditions}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, medicalConditions: next }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Allergies</label>
              <div className="mt-3">
                <ChipGroup
                  options={ALLERGY_OPTIONS}
                  value={form.allergies}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, allergies: next }))
                  }
                />
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Weight goal</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Future UI section only. Saved weight comes from the metrics
                    module.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Sleep schedule</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Future insight field. Not sent to backend.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Goal setting</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Future section for fat loss, gain, or maintenance flows.
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button type="submit" disabled={saving || loading} className="btn-primary">
              {loading ? "Loading..." : saving ? "Saving..." : profileExists ? "Update profile" : "Create profile"}
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Profile roadmap</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-700">1. Save your profile</p>
                <p className="mt-1">Required before diet personalization starts.</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="font-semibold text-sky-700">2. Add weight and activity</p>
                <p className="mt-1">This unlocks BMI, BMR, and TDEE on the backend.</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4">
                <p className="font-semibold text-violet-700">3. Generate a diet plan</p>
                <p className="mt-1">Backend creates seven daily diet documents.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900">Demo notes</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Only backend-supported fields are submitted.</li>
              <li>Weight is captured in the metrics module, not in this form.</li>
              <li>Vegan, keto, and low-carb can be discussed as future scope only.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
