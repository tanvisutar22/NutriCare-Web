import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
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

function InlineAlert({ variant = "info", children }) {
  const styles = {
    info: "bg-slate-50 border-slate-200 text-slate-700",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[variant] || styles.info}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function mealSummaryText(summary) {
  if (!summary?.meals?.length) return "No active diet plan";
  return summary.meals.join(", ");
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
              isActive
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

function PatientCard({ patient, onOpen }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{patient.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Assigned {formatDate(patient.assignedAt)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
          {patient.subscriptionStatus || "inactive"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          Age {patient.age ?? "-"} | Gender {patient.gender || "-"}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          Weight {patient.weight ?? "-"} kg | Height {patient.height ?? "-"} cm
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          Goal {patient.goal || "-"}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          Diet {mealSummaryText(patient.latestDietPlanSummary)}
        </div>
      </div>

      <button type="button" className="btn-primary mt-5 w-full" onClick={onOpen}>
        Open patient
      </button>
    </article>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</div>
    </div>
  );
}

function PatientDetails({ patientDetails, onNoteDraft }) {
  const profile = patientDetails?.patientProfile;
  const activeDiet = patientDetails?.currentActiveDietPlan;

  if (!patientDetails) {
    return (
      <div className="card">
        <EmptyState
          title="Select a patient"
          description="Open one of your assigned patients to review profile details, metrics, diet, and notes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{profile?.name || "Patient"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Subscription {patientDetails.subscription?.status || "inactive"}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onNoteDraft({
                patientAuthId: profile?.authId || "",
                title: "",
                note: "",
                recommendation: "",
              })
            }
          >
            Add note
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailBlock label="Age" value={profile?.age} />
          <DetailBlock label="Gender" value={profile?.gender} />
          <DetailBlock label="Height" value={profile?.height ? `${profile.height} cm` : "-"} />
          <DetailBlock label="Goal" value={profile?.goal} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Current active diet plan</h3>
          {!activeDiet ? (
            <div className="mt-4">
              <EmptyState
                title="No active diet plan"
                description="This patient does not have a current or upcoming active diet plan."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Start date {formatDate(activeDiet.startDate)} | Status {activeDiet.status}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {["breakfast", "lunch", "dinner"].map((mealKey) => (
                  <div key={mealKey} className="rounded-2xl bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold capitalize text-slate-900">{mealKey}</h4>
                    <div className="mt-2 space-y-2">
                      {(activeDiet.meals?.[mealKey] || []).map((food, index) => (
                        <div key={`${mealKey}-${food.foodName}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                          {food.foodName}
                        </div>
                      ))}
                      {!(activeDiet.meals?.[mealKey] || []).length ? (
                        <div className="text-sm text-slate-500">No items</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Body metrics history</h3>
          <div className="mt-4 space-y-3">
            {(patientDetails.metrics || []).slice(0, 8).map((metric) => (
              <div key={metric._id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium capitalize text-slate-900">{metric.metricType}</span>
                  <span className="text-slate-600">{metric.value}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(metric.recordedAt || metric.createdAt)}</p>
              </div>
            ))}
            {!(patientDetails.metrics || []).length ? (
              <EmptyState title="No metrics yet" description="The patient has not recorded body metrics yet." />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Doctor notes and suggestions</h3>
          <div className="mt-4 space-y-3">
            {(patientDetails.notes || []).map((note) => (
              <div key={note._id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{note.title}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.note}</p>
                {note.recommendation ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 whitespace-pre-wrap">
                    {note.recommendation}
                  </div>
                ) : null}
              </div>
            ))}
            {!(patientDetails.notes || []).length ? (
              <EmptyState title="No notes yet" description="No doctor notes have been added for this patient yet." />
            ) : null}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900">Progress and health history</h3>
          <div className="mt-4 space-y-3">
            {(patientDetails.mealLogs || []).slice(0, 5).map((log) => (
              <div key={log._id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-900">{log.mealType || "Meal log"}</span>
                  <span className="text-slate-500">{formatDateTime(log.date || log.createdAt)}</span>
                </div>
                <p className="mt-1 text-slate-700">{log.foodName || log.notes || "Meal activity recorded"}</p>
              </div>
            ))}
            {!(patientDetails.mealLogs || []).length && !(patientDetails.activityLogs || []).length ? (
              <EmptyState
                title="No recent history"
                description="Meal logs and activity history will appear here when the patient records progress."
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteComposer({ patients, draft, setDraft, onSubmit, saving }) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-900">Add doctor note</h3>
      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Patient</label>
          <select
            className="input mt-2"
            value={draft.patientAuthId}
            onChange={(event) => setDraft((current) => ({ ...current, patientAuthId: event.target.value }))}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.patientAuthId} value={patient.patientAuthId}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            className="input mt-2"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Note</label>
          <textarea
            className="input mt-2 min-h-28"
            value={draft.note}
            onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Recommendation</label>
          <textarea
            className="input mt-2 min-h-20"
            value={draft.recommendation}
            onChange={(event) => setDraft((current) => ({ ...current, recommendation: event.target.value }))}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={saving || !draft.patientAuthId || !draft.title.trim() || !draft.note.trim()}
          onClick={onSubmit}
        >
          {saving ? "Saving..." : "Save note"}
        </button>
      </div>
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

  const [noteDraft, setNoteDraft] = useState({
    patientAuthId: "",
    title: "",
    note: "",
    recommendation: "",
  });

  const activeSection = useMemo(() => {
    if (location.pathname.startsWith("/doctor/patients")) return "patients";
    if (location.pathname.startsWith("/doctor/notes")) return "notes";
    if (location.pathname.startsWith("/doctor/profile")) return "profile";
    return "dashboard";
  }, [location.pathname]);

  const profileIncomplete = !doctorProfile?.profileComplete;
  const pendingApproval =
    doctorProfile?.profileComplete &&
    (!doctorProfile?.isApproved || doctorProfile?.approvalStatus !== "approved");

  const hydrateProfileForm = (profileData) => {
    setProfileForm({
      name: profileData?.name || "",
      specialization: profileData?.specialization || "",
      experience: String(profileData?.experience ?? ""),
      qualification: profileData?.qualification || "",
      phoneNumber: profileData?.phoneNumber || "",
      hospital: profileData?.hospital || "",
      licenseNumber: profileData?.licenseNumber || "",
      consultationFee: String(profileData?.consultationFee ?? ""),
      address: profileData?.address || "",
      profilePhoto: profileData?.profilePhoto || "",
    });
  };

  const loadApprovedData = async (selectedPatientId = patientAuthId) => {
    const [summaryRes, walletRes, patientsRes, requestsRes] = await Promise.all([
      getDoctorDashboard(),
      getDoctorWallet(),
      getAssignedPatients(),
      listReviewRequests({ status: "pending" }),
    ]);

    const patientRows = Array.isArray(patientsRes?.data) ? patientsRes.data : [];
    setSummary(summaryRes?.data || null);
    setWallet(walletRes?.data || null);
    setPatients(patientRows);
    setRequests(Array.isArray(requestsRes?.data) ? requestsRes.data : []);

    if (selectedPatientId) {
      const detailsRes = await getPatientDetails(selectedPatientId);
      setPatientDetails(detailsRes?.data || null);
      setNoteDraft((current) => ({
        ...current,
        patientAuthId: selectedPatientId,
      }));
    } else {
      setPatientDetails(null);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const profileRes = await getDoctorProfile();
      const profileData = profileRes?.data || null;
      setDoctorProfile(profileData);
      hydrateProfileForm(profileData);

      if (profileData?.profileComplete && profileData?.isApproved && profileData?.approvalStatus === "approved") {
        await loadApprovedData();
      } else {
        setSummary(null);
        setWallet(null);
        setPatients([]);
        setRequests([]);
        setPatientDetails(null);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientAuthId]);

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
      navigate("/doctor/profile", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const submitDoctorNote = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await createDoctorNote(noteDraft);
      setSuccess(response?.message || "Doctor note saved successfully.");
      setNoteDraft((current) => ({
        ...current,
        title: "",
        note: "",
        recommendation: "",
      }));
      await loadApprovedData(noteDraft.patientAuthId || patientAuthId);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const submitReviewCommit = async (requestId) => {
    const targetPatientId = noteDraft.patientAuthId;
    if (!targetPatientId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await commitReviewRequest(requestId, {
        title: noteDraft.title,
        note: noteDraft.note,
        recommendation: noteDraft.recommendation,
      });
      setSuccess(response?.message || "Review committed successfully.");
      setNoteDraft({
        patientAuthId: targetPatientId,
        title: "",
        note: "",
        recommendation: "",
      });
      await loadApprovedData(targetPatientId || patientAuthId);
      navigate("/doctor/notes", { replace: true });
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
          <h1 className="text-3xl font-bold text-slate-900">Doctor panel</h1>
          <p className="mt-1 text-slate-600">
            Manage assigned patients, review current diet plans, and add care notes without seeing unrelated users.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={load} disabled={loading || saving}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <SectionNav />

      {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
      {success ? <InlineAlert variant="success">{success}</InlineAlert> : null}

      {loading ? (
        <div className="card text-sm text-slate-600">Loading doctor panel...</div>
      ) : profileIncomplete || activeSection === "profile" ? (
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900">Doctor profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete your professional profile so the admin can approve your doctor workspace.
          </p>

          {pendingApproval ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your profile is under admin review. You can still update details here.
            </div>
          ) : null}

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
          <EmptyState
            title="Profile under review"
            description="Your doctor profile is complete and waiting for admin approval. Once approved, your dashboard and patient list will appear here."
            actionText="Open profile"
            onAction={() => navigate("/doctor/profile")}
          />
        </div>
      ) : (
        <>
          {activeSection === "dashboard" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Assigned patients" value={summary?.totalPatients ?? 0} />
                <StatCard label="Doctor notes" value={summary?.totalNotes ?? 0} />
                <StatCard label="Pending reviews" value={summary?.pendingRequests ?? 0} />
                <StatCard label="Wallet balance" value={`Rs. ${wallet?.balance ?? 0}`} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="card">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">Assigned patients</h2>
                    <NavLink to="/doctor/patients" className="text-sm font-medium text-emerald-600">
                      Open patients
                    </NavLink>
                  </div>
                  <div className="mt-5 space-y-3">
                    {patients.slice(0, 5).map((patient) => (
                      <div key={patient.patientAuthId} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">{patient.name}</div>
                            <div className="mt-1 text-sm text-slate-500">{mealSummaryText(patient.latestDietPlanSummary)}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(`/doctor/patients/${patient.patientAuthId}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    {!patients.length ? (
                      <EmptyState
                        title="No assigned patients"
                        description="Patients will appear here once users subscribe and select you as their doctor."
                      />
                    ) : null}
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-lg font-semibold text-slate-900">Wallet history</h2>
                  <div className="mt-4 space-y-3">
                    {(wallet?.transactions || []).slice(0, 8).map((transaction) => (
                      <div key={transaction._id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-900">{transaction.type}</span>
                          <span className="text-slate-600">Rs. {transaction.amount}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
                      </div>
                    ))}
                    {!(wallet?.transactions || []).length ? (
                      <EmptyState title="No wallet history" description="Doctor payout transactions will appear here." />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "patients" ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                {!patients.length ? (
                  <div className="card">
                    <EmptyState
                      title="No assigned patients"
                      description="You currently do not have any patients assigned to your doctor account."
                    />
                  </div>
                ) : (
                  patients.map((patient) => (
                    <PatientCard
                      key={patient.patientAuthId}
                      patient={patient}
                      onOpen={() => navigate(`/doctor/patients/${patient.patientAuthId}`)}
                    />
                  ))
                )}
              </div>
              <PatientDetails patientDetails={patientDetails} onNoteDraft={setNoteDraft} />
            </div>
          ) : null}

          {activeSection === "notes" ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <NoteComposer
                  patients={patients}
                  draft={noteDraft}
                  setDraft={setNoteDraft}
                  onSubmit={submitDoctorNote}
                  saving={saving}
                />

                <div className="card">
                  <h2 className="text-lg font-semibold text-slate-900">Recent patient details</h2>
                  {patientDetails ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      Writing for {patientDetails.patientProfile?.name || "selected patient"}.
                    </div>
                  ) : (
                    <div className="mt-4">
                      <EmptyState
                        title="No patient opened"
                        description="Open a patient from the Patients tab if you want extra context while writing notes."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-slate-900">Pending review requests</h2>
                <div className="mt-4 space-y-3">
                  {requests.map((request) => (
                    <div key={request._id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">Patient {String(request.patientAuthId).slice(-6)}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Weight {request.snapshot?.weight ?? "-"} | BMI {request.snapshot?.bmi ?? "-"} | TDEE {request.snapshot?.tdee ?? "-"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setNoteDraft((current) => ({
                              ...current,
                              patientAuthId: request.patientAuthId,
                            }));
                            navigate(`/doctor/patients/${request.patientAuthId}`);
                          }}
                        >
                          Open patient
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-primary mt-4"
                        disabled={saving || noteDraft.patientAuthId !== request.patientAuthId || !noteDraft.title.trim() || !noteDraft.note.trim()}
                        onClick={() => submitReviewCommit(request._id)}
                      >
                        {saving ? "Saving..." : "Commit current note"}
                      </button>
                    </div>
                  ))}
                  {!requests.length ? (
                    <EmptyState title="No pending requests" description="There are no pending doctor review requests right now." />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
