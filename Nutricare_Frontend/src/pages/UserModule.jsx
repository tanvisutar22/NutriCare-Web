import { useEffect, useMemo, useState } from "react";
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

function toggleFromList(list, value) {
  const set = new Set(Array.isArray(list) ? list : []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set);
}

function FieldLabel({ children }) {
  return <label className="text-sm text-slate-700 font-medium">{children}</label>;
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

export default function UserModule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);

  const requiredMissing = useMemo(() => {
    // Backend controller requires name/gender/age/height.
    // Backend schema also expects foodPreference/medicalConditions/allergies,
    // so we treat them as required here to avoid validator failures.
    const missing = [];
    if (!form.name.trim()) missing.push("name");
    if (!form.gender) missing.push("gender");
    if (!String(form.age).trim()) missing.push("age");
    if (!String(form.height).trim()) missing.push("height");
    if (!form.foodPreference) missing.push("foodPreference");
    if (!form.medicalConditions?.length) missing.push("medicalConditions");
    if (!form.allergies?.length) missing.push("allergies");
    return missing;
  }, [form]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const res = await getMyProfile(); // ApiResponse
        const data = res?.data;
        if (!alive) return;

        setProfileExists(true);
        setForm({
          name: data?.name || "",
          gender: data?.gender || "",
          age: data?.age ?? "",
          height: data?.height ?? "",
          foodPreference: data?.foodPreference || "",
          medicalConditions: Array.isArray(data?.medicalConditions)
            ? data.medicalConditions
            : data?.medicalConditions
              ? [String(data.medicalConditions)]
              : [],
          allergies: Array.isArray(data?.allergies)
            ? data.allergies
            : data?.allergies
              ? [String(data.allergies)]
              : [],
        });
      } catch (e) {
        if (!alive) return;
        // If profile doesn't exist yet, backend returns 404.
        const status = e?.response?.status;
        if (status === 404) {
          setProfileExists(false);
          setForm(initialForm);
        } else {
          setError(getApiErrorMessage(e));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (requiredMissing.length) {
      setError(`Please fill: ${requiredMissing.join(", ")}`);
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

      const res = profileExists
        ? await updateMyProfile(payload)
        : await createUserProfile(payload);

      setProfileExists(true);
      setSuccess(res?.message || "Profile saved successfully.");
    } catch (e2) {
      setError(getApiErrorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Your health profile</h2>
            <p className="text-slate-600 mt-1">
              We use this information to personalize your metrics and diet plans.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {profileExists ? "Profile saved" : "Profile incomplete"}
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {profileExists ? "Update profile" : "Create profile"}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Please keep details accurate for diet generation and metric calculations.
            </p>

            {loading ? (
              <div className="mt-5 text-sm text-slate-700">Loading profile…</div>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input
                    className="input mt-2"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Gender</FieldLabel>
                    <select
                      className="input mt-2"
                      value={form.gender}
                      onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Age</FieldLabel>
                    <input
                      className="input mt-2"
                      type="number"
                      min={0}
                      value={form.age}
                      onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                      placeholder="Years"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Height (cm)</FieldLabel>
                    <input
                      className="input mt-2"
                      type="number"
                      min={0}
                      value={form.height}
                      onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
                      placeholder="e.g. 170"
                    />
                  </div>
                  <div>
                    <FieldLabel>Food preference</FieldLabel>
                    <select
                      className="input mt-2"
                      value={form.foodPreference}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, foodPreference: e.target.value }))
                      }
                    >
                      <option value="">Select preference</option>
                      {FOOD_PREFERENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>Medical conditions</FieldLabel>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MEDICAL_CONDITION_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.medicalConditions.includes(o.value)}
                          onChange={() =>
                            setForm((p) => ({
                              ...p,
                              medicalConditions: toggleFromList(p.medicalConditions, o.value),
                            }))
                          }
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel>Allergies</FieldLabel>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALLERGY_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.allergies.includes(o.value)}
                          onChange={() =>
                            setForm((p) => ({
                              ...p,
                              allergies: toggleFromList(p.allergies, o.value),
                            }))
                          }
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={saving || loading}>
                  {saving ? "Saving..." : profileExists ? "Update profile" : "Create profile"}
                </button>

                {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
                {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}
              </form>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900">Why this matters</h3>
            <p className="mt-2 text-sm text-slate-600">
              Accurate profile details help us calculate BMI, BMR, TDEE and build better diet
              plans for you.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              You can update this information at any time as your lifestyle or health changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

