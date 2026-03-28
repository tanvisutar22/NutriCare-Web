import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../shared/api/http";
import {
  bookDoctor,
  getMyAssignedDoctor,
  listApprovedDoctors,
} from "../features/user/userApi";

export default function DoctorBooking() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [doctorsRes, assignedRes] = await Promise.all([
        listApprovedDoctors(),
        getMyAssignedDoctor(),
      ]);
      setDoctors(Array.isArray(doctorsRes?.data) ? doctorsRes.data : []);
      setAssignedDoctor(assignedRes?.data || null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectDoctor = async (doctorAuthId) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await bookDoctor({ doctorAuthId });
      setSuccess(response?.message || "Doctor selected successfully.");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Choose your doctor</h2>
        <p className="mt-1 text-slate-600">
          Select only from approved doctors. Booking requires an active subscription and an available doctor slot.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">My doctor</h3>
        {!assignedDoctor?.doctor ? (
          <p className="mt-3 text-sm text-slate-500">No doctor assigned yet.</p>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{assignedDoctor.doctor.name}</p>
            <p className="mt-1 text-sm text-slate-600">
              {assignedDoctor.doctor.specialization || "Dietician"} | {assignedDoctor.doctor.experience || 0} years
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="text-sm text-slate-600">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="card text-sm text-slate-500">No approved doctors available right now.</div>
        ) : (
          doctors.map((doctor) => (
            <div key={doctor._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {doctor.specialization || "Dietician"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    doctor.isAvailable
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {doctor.isAvailable ? "Available" : "Doctor full"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Experience: {doctor.experience || 0} years</p>
                <p>Consultation fee: Rs. {doctor.consultationFee || 0}</p>
                <p>
                  Active patients: {doctor.activePatients || 0} / {doctor.patientCapacity || 3}
                </p>
              </div>

              <button
                type="button"
                className="btn-primary mt-5 w-full"
                onClick={() => selectDoctor(doctor.authId)}
                disabled={saving || !doctor.isAvailable || Boolean(assignedDoctor?.doctor)}
              >
                {assignedDoctor?.doctor ? "Doctor already selected" : doctor.isAvailable ? "Select Doctor" : "Unavailable"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
