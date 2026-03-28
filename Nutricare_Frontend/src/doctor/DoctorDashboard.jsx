import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  commitReviewRequest,
  createDoctorProfile,
  getDoctorDashboard,
  getDoctorProfile,
  getDoctorWallet,
  listReviewRequests,
} from "./doctorApi";

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

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    specialization: "",
    experience: "",
    qualification: "",
    phoneNumber: "",
    hospital: "",
    licenseNumber: "",
    consultationFee: "",
    address: "",
    profilePhoto: "",
  });

  const profileIncomplete = !doctorProfile?.profileComplete;
  const pendingApproval =
    doctorProfile?.profileComplete &&
    (!doctorProfile?.isApproved || doctorProfile?.approvalStatus !== "approved");

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const profileRes = await getDoctorProfile();
      const profileData = profileRes?.data || null;
      setDoctorProfile(profileData);

      if (profileData?.name) {
        setProfileForm({
          name: profileData.name || "",
          specialization: profileData.specialization || "",
          experience: String(profileData.experience ?? ""),
          qualification: profileData.qualification || "",
          phoneNumber: profileData.phoneNumber || "",
          hospital: profileData.hospital || "",
          licenseNumber: profileData.licenseNumber || "",
          consultationFee: String(profileData.consultationFee ?? ""),
          address: profileData.address || "",
          profilePhoto: profileData.profilePhoto || "",
        });
      }

      if (!profileData?.profileComplete || !profileData?.isApproved) {
        setSummary(null);
        setWallet(null);
        setRequests([]);
        return;
      }

      const [summaryRes, walletRes, requestsRes] = await Promise.all([
        getDoctorDashboard(),
        getDoctorWallet(),
        listReviewRequests({ status: "pending" }),
      ]);
      setSummary(summaryRes?.data || null);
      setWallet(walletRes?.data || null);
      setRequests(Array.isArray(requestsRes?.data) ? requestsRes.data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...profileForm,
        experience: Number(profileForm.experience || 0),
        consultationFee: Number(profileForm.consultationFee || 0),
      };
      const response = await createDoctorProfile(payload);
      setSuccess(response?.message || "Doctor profile saved successfully.");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const submitCommit = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await commitReviewRequest(selected._id, {
        title,
        note,
        recommendation,
      });
      setSuccess(response?.message || "Review note submitted");
      setSelected(null);
      setTitle("");
      setNote("");
      setRecommendation("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Doctor workspace</h2>
          <p className="mt-1 text-slate-600">
            Complete your professional profile, wait for approval, and then review patient requests.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      {loading ? (
        <div className="text-sm text-slate-600">Loading...</div>
      ) : profileIncomplete ? (
        <div className="card">
          <h3 className="text-xl font-semibold text-slate-900">Complete your doctor profile</h3>
          <p className="mt-1 text-sm text-slate-600">
            Full doctor details are required before your account can enter admin review.
          </p>

          <form onSubmit={submitProfile} className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["name", "Full name"],
              ["specialization", "Specialization"],
              ["experience", "Experience (years)"],
              ["qualification", "Qualification"],
              ["phoneNumber", "Phone number"],
              ["hospital", "Clinic / Hospital"],
              ["licenseNumber", "License / Registration number"],
              ["consultationFee", "Consultation fee"],
              ["address", "Address"],
              ["profilePhoto", "Profile photo URL"],
            ].map(([field, label]) => (
              <div key={field} className={field === "address" ? "md:col-span-2" : ""}>
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <input
                  className="input mt-2"
                  value={profileForm[field]}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save doctor profile"}
              </button>
            </div>
          </form>
        </div>
      ) : pendingApproval ? (
        <div className="card">
          <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Pending review
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-900">Your profile is under review</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Please wait for admin approval. You will get full doctor dashboard access
            once your profile has been approved.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Doctor</p>
              <p className="mt-2 font-semibold text-slate-900">{doctorProfile?.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Specialization</p>
              <p className="mt-2 font-semibold text-slate-900">{doctorProfile?.specialization || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Qualification</p>
              <p className="mt-2 font-semibold text-slate-900">{doctorProfile?.qualification || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">License number</p>
              <p className="mt-2 font-semibold text-slate-900">{doctorProfile?.licenseNumber || "-"}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Total patients" value={summary?.totalPatients ?? 0} />
            <StatCard label="Total notes" value={summary?.totalNotes ?? 0} />
            <StatCard label="Pending requests" value={pendingCount} />
            <StatCard label="Wallet balance" value={`Rs. ${wallet?.balance ?? 0}`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900">Pending review requests</h3>
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
                        <th className="py-2 pr-3">TDEE</th>
                        <th className="py-2 pr-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request._id} className="border-t border-slate-100">
                          <td className="py-3 pr-3 text-slate-900">{String(request.patientAuthId).slice(-6)}</td>
                          <td className="py-3 pr-3">{request.snapshot?.weight ?? "-"}</td>
                          <td className="py-3 pr-3">{request.snapshot?.bmi ?? "-"}</td>
                          <td className="py-3 pr-3">{request.snapshot?.tdee ?? "-"}</td>
                          <td className="py-3 pr-3">
                            <button type="button" className="btn-primary" onClick={() => setSelected(request)}>
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

            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900">Doctor payout history</h3>
              <div className="mt-4 space-y-3">
                {wallet?.transactions?.length ? (
                  wallet.transactions.slice(0, 8).map((transaction) => (
                    <div key={transaction._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900">{transaction.type}</span>
                        <span className="text-slate-600">Rs. {transaction.amount}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No doctor wallet transactions yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Commit review note</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Patient snapshot: weight {selected.snapshot?.weight ?? "-"}, BMI {selected.snapshot?.bmi ?? "-"}.
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input className="input mt-2" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Note</label>
                <textarea className="input mt-2 min-h-28" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Recommendation</label>
                <textarea className="input mt-2 min-h-20" value={recommendation} onChange={(event) => setRecommendation(event.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={submitCommit} disabled={saving || !title.trim() || !note.trim()}>
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
