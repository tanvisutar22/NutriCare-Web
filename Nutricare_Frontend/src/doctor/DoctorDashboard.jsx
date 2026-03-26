import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  commitReviewRequest,
  getDoctorDashboard,
  getDoctorWallet,
  getDoctorProfile,
  listReviewRequests,
  createDoctorProfile,
} from "./doctorApi";

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

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

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [notApproved, setNotApproved] = useState(false);
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    specialization: "Dietician",
    experience: "",
    hospital: "",
  });

  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [saving, setSaving] = useState(false);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 1) Profile check (allowed even before approval)
      const prof = await getDoctorProfile();
      const profData = prof?.data || null;
      setDoctorProfile(profData);

      if (!profData) {
        setNeedsProfile(true);
        setNotApproved(false);
        setSummary(null);
        setWallet(null);
        setRequests([]);
        return;
      }

      setNeedsProfile(false);

      if (!profData.isApproved) {
        setNotApproved(true);
        setSummary(null);
        setWallet(null);
        setRequests([]);
        return;
      }

      setNotApproved(false);

      // 2) Approved doctor endpoints
      const [s, w, r] = await Promise.all([
        getDoctorDashboard(),
        getDoctorWallet(),
        listReviewRequests({ status: "pending" }),
      ]);
      setSummary(s?.data || null);
      setWallet(w?.data || null);
      setRequests(Array.isArray(r?.data) ? r.data : []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCommit = (req) => {
    setSelected(req);
    setTitle("");
    setNote("");
    setRecommendation("");
    setError("");
    setSuccess("");
  };

  const submitCommit = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await commitReviewRequest(selected._id, {
        title,
        note,
        recommendation,
      });
      setSuccess(res?.message || "Review committed");
      setSelected(null);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: profileForm.name.trim(),
        specialization: profileForm.specialization.trim() || "Dietician",
        experience: profileForm.experience === "" ? 0 : Number(profileForm.experience),
        hospital: profileForm.hospital.trim(),
      };
      const res = await createDoctorProfile(payload);
      setSuccess(res?.message || "Profile created");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Doctor workspace</h2>
          <p className="mt-1 text-slate-600">
            Review pending requests and add professional notes.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      {loading ? (
        <div className="text-sm text-slate-700">Loading…</div>
      ) : needsProfile ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Create doctor profile</h3>
          <p className="mt-1 text-sm text-slate-600">
            Please complete your doctor profile. After that, wait for admin approval.
          </p>
          <form onSubmit={submitProfile} className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                className="input mt-2"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Specialization</label>
              <input
                className="input mt-2"
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, specialization: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Experience (years)</label>
              <input
                className="input mt-2"
                type="number"
                min={0}
                value={profileForm.experience}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, experience: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Hospital (optional)</label>
              <input
                className="input mt-2"
                value={profileForm.hospital}
                onChange={(e) => setProfileForm((p) => ({ ...p, hospital: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </div>
      ) : notApproved ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">You are not approved yet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Your profile is submitted. Please wait for admin approval. Stay tuned.
          </p>
        </div>
      ) : null}

      {!loading && !needsProfile && !notApproved ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total patients" value={summary?.totalPatients ?? 0} />
          <StatCard label="Total notes" value={summary?.totalNotes ?? 0} />
          <StatCard label="Pending requests" value={pendingCount} />
          <StatCard label="Wallet balance" value={`₹${wallet?.balance ?? 0}`} />
        </div>
      ) : null}

      {!loading && !needsProfile && !notApproved ? (
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Pending review requests</h3>
        <p className="mt-1 text-sm text-slate-600">
          Pick a request, review snapshot metrics, and commit a note.
        </p>

        {requests.length === 0 ? (
          <div className="mt-5 text-sm text-slate-600">No pending requests.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">Patient</th>
                  <th className="py-2 pr-3">Weight</th>
                  <th className="py-2 pr-3">BMI</th>
                  <th className="py-2 pr-3">BMR</th>
                  <th className="py-2 pr-3">TDEE</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 text-slate-900">
                      {String(r.patientAuthId).slice(-6)}
                    </td>
                    <td className="py-3 pr-3">{r.snapshot?.weight ?? "—"}</td>
                    <td className="py-3 pr-3">{r.snapshot?.bmi ?? "—"}</td>
                    <td className="py-3 pr-3">{r.snapshot?.bmr ?? "—"}</td>
                    <td className="py-3 pr-3">{r.snapshot?.tdee ?? "—"}</td>
                    <td className="py-3 pr-3 text-slate-600">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => openCommit(r)}
                      >
                        Commit note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Commit review note</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Patient snapshot: weight {selected.snapshot?.weight ?? "—"}, BMI{" "}
                  {selected.snapshot?.bmi ?? "—"}.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input className="input mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Note</label>
                <textarea
                  className="input mt-2 min-h-28"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Recommendation (optional)</label>
                <textarea
                  className="input mt-2 min-h-20"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelected(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={submitCommit}
                  disabled={saving || !title.trim() || !note.trim()}
                >
                  {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

