import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../shared/api/http";
import {
  commitReviewRequest,
  createDoctorNote,
  createDoctorProfile,
  getAssignedPatients,
  getDoctorDashboard,
  getDoctorProfile,
  getDoctorWallet,
  getPatientDetails,
  listReviewRequests,
} from "./doctorApi";

const fmtDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};
const fmtDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
};
const money = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;
const mealSummary = (s) => (s?.meals?.length ? s.meals.join(", ") : "No active diet plan");

function Alert({ variant = "info", children }) {
  const styles = {
    info: "border-white/10 bg-white/8 text-slate-200",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>;
}

function Pill({ children, tone = "neutral" }) {
  const styles = {
    neutral: "bg-white/8 text-slate-100 ring-1 ring-white/10",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,25,56,0.9),rgba(8,18,40,0.96))] p-6 text-slate-100 shadow-[0_22px_70px_-40px_rgba(2,6,23,0.9)] ${className}`}>{children}</div>;
}

function Stat({ label, value, subtitle }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,34,74,0.96),rgba(10,24,53,0.98))] p-5 shadow-[0_20px_60px_-35px_rgba(2,6,23,0.95)]">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</div>
      {subtitle ? <div className="mt-2 text-sm text-slate-300">{subtitle}</div> : null}
    </div>
  );
}

function SectionNav() {
  const items = [
    { to: "/doctor/dashboard", label: "Dashboard" },
    { to: "/doctor/patients", label: "Patients" },
    { to: "/doctor/notes", label: "Notes / Suggestions" },
    { to: "/doctor/profile", label: "Profile" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              "rounded-full px-4 py-2 text-sm font-medium transition",
              isActive ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-900/30" : "border border-white/10 bg-white/8 text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-300/10",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value || "-"}</div>
    </div>
  );
}

function DoctorEmptyState({ title, description, actionText, onAction }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/6 p-6 text-center">
      <p className="font-medium text-white">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p> : null}
      {actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 text-sm font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline"
        >
          {actionText}
        </button>
      ) : null}
    </div>
  );
}

export default function DoctorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientAuthId } = useParams();

  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", specialization: "", experience: "", qualification: "", phoneNumber: "",
    hospital: "", licenseNumber: "", consultationFee: "", address: "", profilePhoto: "",
  });
  const [noteDraft, setNoteDraft] = useState({ patientAuthId: "", title: "", note: "", recommendation: "" });

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith("/doctor/patients")) return "patients";
    if (location.pathname.startsWith("/doctor/notes")) return "notes";
    if (location.pathname.startsWith("/doctor/profile")) return "profile";
    return "dashboard";
  }, [location.pathname]);

  const profileIncomplete = !doctorProfile?.profileComplete;
  const pendingApproval = doctorProfile?.profileComplete && (!doctorProfile?.isApproved || doctorProfile?.approvalStatus !== "approved");

  const hydrateProfileForm = (data) => setProfileForm({
    name: data?.name || "", specialization: data?.specialization || "", experience: String(data?.experience ?? ""),
    qualification: data?.qualification || "", phoneNumber: data?.phoneNumber || "", hospital: data?.hospital || "",
    licenseNumber: data?.licenseNumber || "", consultationFee: String(data?.consultationFee ?? ""), address: data?.address || "",
    profilePhoto: data?.profilePhoto || "",
  });

  const loadApprovedData = async (selectedPatientId = patientAuthId) => {
    const [summaryRes, walletRes, patientsRes, requestsRes] = await Promise.all([
      getDoctorDashboard(), getDoctorWallet(), getAssignedPatients(), listReviewRequests({ status: "pending" }),
    ]);
    const rows = Array.isArray(patientsRes?.data) ? patientsRes.data : [];
    setSummary(summaryRes?.data || null);
    setWallet(walletRes?.data || null);
    setPatients(rows);
    setRequests(Array.isArray(requestsRes?.data) ? requestsRes.data : []);
    if (selectedPatientId) {
      const detailsRes = await getPatientDetails(selectedPatientId);
      setPatientDetails(detailsRes?.data || null);
      setNoteDraft((c) => ({ ...c, patientAuthId: selectedPatientId }));
    } else setPatientDetails(null);
  };

  const load = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const profileRes = await getDoctorProfile();
      const profileData = profileRes?.data || null;
      setDoctorProfile(profileData);
      hydrateProfileForm(profileData);
      if (profileData?.profileComplete && profileData?.isApproved && profileData?.approvalStatus === "approved") await loadApprovedData();
      else { setSummary(null); setWallet(null); setPatients([]); setRequests([]); setPatientDetails(null); }
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientAuthId]);

  const submitProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const payload = { ...profileForm, experience: Number(profileForm.experience || 0), consultationFee: Number(profileForm.consultationFee || 0) };
      const response = await createDoctorProfile(payload);
      setSuccess(response?.message || "Doctor profile saved successfully.");
      await load();
      navigate("/doctor/profile", { replace: true });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally { setSaving(false); }
  };

  const submitDoctorNote = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await createDoctorNote(noteDraft);
      setSuccess(response?.message || "Doctor note saved successfully.");
      setNoteDraft((c) => ({ ...c, title: "", note: "", recommendation: "" }));
      await loadApprovedData(noteDraft.patientAuthId || patientAuthId);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally { setSaving(false); }
  };

  const submitReviewCommit = async (requestId) => {
    const targetPatientId = noteDraft.patientAuthId;
    if (!targetPatientId) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await commitReviewRequest(requestId, {
        title: noteDraft.title, note: noteDraft.note, recommendation: noteDraft.recommendation,
      });
      setSuccess(response?.message || "Review committed successfully.");
      setNoteDraft({ patientAuthId: targetPatientId, title: "", note: "", recommendation: "" });
      await loadApprovedData(targetPatientId || patientAuthId);
      navigate("/doctor/notes", { replace: true });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#071229_0%,#0f2457_100%)]">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section className="rounded-[36px] border border-emerald-100/70 bg-[linear-gradient(135deg,#062c2c_0%,#114b4b_38%,#ecfeff_100%)] px-6 py-8 text-white shadow-[0_30px_100px_-40px_rgba(6,44,44,0.95)] md:px-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100 ring-1 ring-white/10">Doctor Workspace</div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Doctor Command Center</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/90 md:text-base">Manage assigned patients, review health context, write care notes, and track exactly what admin has paid you.</p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-slate-950/20 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-28px_rgba(2,6,23,0.85)] backdrop-blur transition hover:bg-slate-950/30 disabled:opacity-60"
              type="button"
              onClick={load}
              disabled={loading || saving}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        <SectionNav />
        {error ? <Alert variant="error">{error}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}

        {loading ? (
          <Card><div className="text-sm text-slate-300">Loading doctor panel...</div></Card>
        ) : profileIncomplete || activeSection === "profile" ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Doctor profile</h2>
                <p className="mt-1 text-sm text-slate-300">Complete your professional profile so admin can approve your workspace.</p>
              </div>
              <Pill tone={pendingApproval ? "warning" : "neutral"}>{pendingApproval ? "Under review" : profileIncomplete ? "Profile incomplete" : "Ready"}</Pill>
            </div>
            {pendingApproval ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Your profile is under admin review. You can still update details here.</div> : null}
            <form onSubmit={submitProfile} className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["name","Full name"],["specialization","Specialization"],["experience","Experience (years)"],["qualification","Qualification"],
                ["phoneNumber","Phone number"],["hospital","Clinic / Hospital"],["licenseNumber","License / Registration number"],
                ["consultationFee","Consultation fee"],["address","Address"],["profilePhoto","Profile photo URL"],
              ].map(([field, label]) => (
                <div key={field} className={field === "address" ? "md:col-span-2" : ""}>
                  <label className="text-sm font-medium text-slate-200">{label}</label>
                  <input className="input mt-2" value={profileForm[field]} onChange={(e) => setProfileForm((c) => ({ ...c, [field]: e.target.value }))} />
                </div>
              ))}
              <div className="md:col-span-2"><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save doctor profile"}</button></div>
            </form>
          </Card>
        ) : pendingApproval ? (
          <Card><DoctorEmptyState title="Profile under review" description="Your doctor profile is complete and waiting for admin approval. Once approved, your dashboard and patient list will appear here." actionText="Open profile" onAction={() => navigate("/doctor/profile")} /></Card>
        ) : (
          <>
            {activeSection === "dashboard" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Assigned patients" value={summary?.totalPatients ?? 0} subtitle="Patients currently linked to you" />
                  <Stat label="Doctor notes" value={summary?.totalNotes ?? 0} subtitle="Notes and recommendations created" />
                  <Stat label="Pending reviews" value={summary?.pendingRequests ?? 0} subtitle="Requests waiting for review" />
                  <Stat label="Wallet balance" value={money(wallet?.balance)} subtitle="Available in doctor wallet" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Stat label="Paid by admin" value={money(wallet?.totalPaid)} subtitle="Total credited through admin payout" />
                  <Stat label="Pending payout" value={money(wallet?.pendingAmount)} subtitle="Waiting to be processed by admin" />
                  <Stat label="Latest paid month" value={wallet?.latestPaidPayout?.monthKey || "-"} subtitle={wallet?.latestPaidPayout ? money(wallet.latestPaidPayout.totalAmount) : "No paid payout yet"} />
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Assigned patients</h2>
                        <p className="mt-1 text-sm text-slate-300">Quick access to your current patient list.</p>
                      </div>
                      <NavLink to="/doctor/patients" className="text-sm font-medium text-emerald-600">Open patients</NavLink>
                    </div>
                    <div className="mt-5 space-y-3">
                      {patients.slice(0, 5).map((patient) => (
                        <div key={patient.patientAuthId} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{patient.name}</div>
                              <div className="mt-1 text-sm text-slate-300">{mealSummary(patient.latestDietPlanSummary)}</div>
                            </div>
                            <button type="button" className="btn-secondary" onClick={() => navigate(`/doctor/patients/${patient.patientAuthId}`)}>View</button>
                          </div>
                        </div>
                      ))}
                      {!patients.length ? <DoctorEmptyState title="No assigned patients" description="Patients will appear here once users subscribe and select you as their doctor." /> : null}
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Wallet history</h2>
                        <p className="mt-1 text-sm text-slate-300">See payout credits and attached payout months.</p>
                      </div>
                      <Pill tone="success">{money(wallet?.totalPaid)}</Pill>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(wallet?.transactions || []).slice(0, 8).map((tx) => (
                        <div key={tx._id} className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-white">{tx.type}</div>
                              <p className="mt-1 text-xs text-slate-400">{tx.meta?.monthKey ? `Month ${tx.meta.monthKey}` : "Wallet entry"}</p>
                            </div>
                            <span className="font-medium text-slate-200">{money(tx.amount)}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{fmtDateTime(tx.createdAt)}</p>
                        </div>
                      ))}
                      {!(wallet?.transactions || []).length ? <DoctorEmptyState title="No wallet history" description="Doctor payout transactions will appear here." /> : null}
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {activeSection === "patients" ? (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  {!patients.length ? <Card><DoctorEmptyState title="No assigned patients" description="You currently do not have any patients assigned to your doctor account." /></Card> : patients.map((patient) => (
                    <Card key={patient.patientAuthId}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{patient.name}</h3>
                          <p className="mt-1 text-sm text-slate-300">Assigned {fmtDate(patient.assignedAt)}</p>
                        </div>
                        <Pill tone={patient.subscriptionStatus === "active" ? "success" : "warning"}>{patient.subscriptionStatus || "inactive"}</Pill>
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-sm text-slate-200">Age {patient.age ?? "-"} | Gender {patient.gender || "-"}</div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-sm text-slate-200">Weight {patient.weight ?? "-"} kg | Height {patient.height ?? "-"} cm</div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-sm text-slate-200">Goal {patient.goal || "-"}</div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-3 text-sm text-slate-200">Diet {mealSummary(patient.latestDietPlanSummary)}</div>
                      </div>
                      <button type="button" className="btn-primary mt-5 w-full" onClick={() => navigate(`/doctor/patients/${patient.patientAuthId}`)}>Open patient</button>
                    </Card>
                  ))}
                </div>
                {!patientDetails ? (
                  <Card><DoctorEmptyState title="Select a patient" description="Open one of your assigned patients to review profile details, metrics, diet, and notes." /></Card>
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold text-white">{patientDetails.patientProfile?.name || "Patient"}</h2>
                          <p className="mt-1 text-sm text-slate-300">Subscription {patientDetails.subscription?.status || "inactive"}</p>
                        </div>
                        <button type="button" className="btn-secondary" onClick={() => setNoteDraft({ patientAuthId: patientDetails.patientProfile?.authId || "", title: "", note: "", recommendation: "" })}>Add note</button>
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Detail label="Age" value={patientDetails.patientProfile?.age} />
                        <Detail label="Gender" value={patientDetails.patientProfile?.gender} />
                        <Detail label="Height" value={patientDetails.patientProfile?.height ? `${patientDetails.patientProfile.height} cm` : "-"} />
                        <Detail label="Goal" value={patientDetails.patientProfile?.goal} />
                      </div>
                    </Card>
                    <Card>
                      <h3 className="text-lg font-semibold text-white">Current active diet plan</h3>
                      {!patientDetails.currentActiveDietPlan ? <div className="mt-4"><DoctorEmptyState title="No active diet plan" description="This patient does not have a current or upcoming active diet plan." /></div> : (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-slate-200">Start date {fmtDate(patientDetails.currentActiveDietPlan.startDate)} | Status {patientDetails.currentActiveDietPlan.status}</div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {["breakfast","lunch","dinner"].map((mealKey) => (
                              <div key={mealKey} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                                <h4 className="text-sm font-semibold capitalize text-white">{mealKey}</h4>
                                <div className="mt-2 space-y-2">
                                  {(patientDetails.currentActiveDietPlan.meals?.[mealKey] || []).map((food, index) => (
                                    <div
                                      key={`${mealKey}-${food.foodName}-${index}`}
                                      className="rounded-xl border border-white/8 bg-slate-950/30 px-3 py-2 text-sm text-slate-100"
                                    >
                                      {food.foodName}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            ) : null}

            {activeSection === "notes" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <Card>
                  <h3 className="text-lg font-semibold text-white">Add doctor note</h3>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-200">Patient</label>
                      <select className="input mt-2" value={noteDraft.patientAuthId} onChange={(e) => setNoteDraft((c) => ({ ...c, patientAuthId: e.target.value }))}>
                        <option value="">Select patient</option>
                        {patients.map((patient) => <option key={patient.patientAuthId} value={patient.patientAuthId}>{patient.name}</option>)}
                      </select>
                    </div>
                    <div><label className="text-sm font-medium text-slate-200">Title</label><input className="input mt-2" value={noteDraft.title} onChange={(e) => setNoteDraft((c) => ({ ...c, title: e.target.value }))} /></div>
                    <div><label className="text-sm font-medium text-slate-200">Note</label><textarea className="input mt-2 min-h-28" value={noteDraft.note} onChange={(e) => setNoteDraft((c) => ({ ...c, note: e.target.value }))} /></div>
                    <div><label className="text-sm font-medium text-slate-200">Recommendation</label><textarea className="input mt-2 min-h-20" value={noteDraft.recommendation} onChange={(e) => setNoteDraft((c) => ({ ...c, recommendation: e.target.value }))} /></div>
                    <button type="button" className="btn-primary" disabled={saving || !noteDraft.patientAuthId || !noteDraft.title.trim() || !noteDraft.note.trim()} onClick={submitDoctorNote}>{saving ? "Saving..." : "Save note"}</button>
                  </div>
                </Card>
                <Card>
                  <h2 className="text-xl font-semibold text-white">Pending review requests</h2>
                  <div className="mt-4 space-y-3">
                    {requests.map((request) => (
                      <div key={request._id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">Patient {String(request.patientAuthId).slice(-6)}</div>
                            <div className="mt-1 text-xs text-slate-300">Weight {request.snapshot?.weight ?? "-"} | BMI {request.snapshot?.bmi ?? "-"} | TDEE {request.snapshot?.tdee ?? "-"}</div>
                          </div>
                          <button type="button" className="btn-secondary" onClick={() => { setNoteDraft((c) => ({ ...c, patientAuthId: request.patientAuthId })); navigate(`/doctor/patients/${request.patientAuthId}`); }}>Open patient</button>
                        </div>
                        <button type="button" className="btn-primary mt-4" disabled={saving || noteDraft.patientAuthId !== request.patientAuthId || !noteDraft.title.trim() || !noteDraft.note.trim()} onClick={() => submitReviewCommit(request._id)}>{saving ? "Saving..." : "Commit current note"}</button>
                      </div>
                    ))}
                    {!requests.length ? <DoctorEmptyState title="No pending requests" description="There are no pending doctor review requests right now." /> : null}
                  </div>
                </Card>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
