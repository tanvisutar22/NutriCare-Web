import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  // const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/getUser");
        setProfile(res.data.data);
        setFormData(res.data.data);
      } catch {
        setError("Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdate = async () => {
    try {
      const res = await api.patch("/user/updateUser", formData);
      setProfile(res.data.data);
      setEditing(false);
    } catch {
      setError("Update failed");
    }
  };

  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      <h2 className="text-2xl font-semibold text-teal-600">User Profile</h2>
      {profile && (
        <div className="card space-y-4">
          {!editing ? (
            <>
              <p>
                <strong>Age:</strong> {profile.age}
              </p>
              <p>
                <strong>Gender:</strong> {profile.gender}
              </p>
              <p>
                <strong>Height:</strong> {profile.height} cm
              </p>
              <p>
                <strong>Food Preference:</strong> {profile.foodPreference}
              </p>
              <p>
                <strong>Medical Conditions:</strong>{" "}
                {profile.medicalConditions?.join(", ") || "None"}
              </p>
              <p>
                <strong>Allergies:</strong>{" "}
                {profile.allergies?.join(", ") || "None"}
              </p>
              <p>
                <strong>Doctor Constraints:</strong>{" "}
                {profile.doctorConstraints || "None"}
              </p>
              <div className="flex gap-4 mt-4">
                {/* <button
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit
                </button> */}
                {/* <button onClick={logout} className="btn-secondary">
                  Logout
                </button> */}
              </div>
            </>
          ) : (
            <>
              <input
                name="age"
                value={formData.age || ""}
                onChange={handleChange}
                className="input"
                placeholder="Age"
              />
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className="input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                name="height"
                value={formData.height || ""}
                onChange={handleChange}
                className="input"
                placeholder="Height (cm)"
              />
              <select
                name="foodPreference"
                value={formData.foodPreference || ""}
                onChange={handleChange}
                className="input"
              >
                <option value="veg">Vegetarian</option>
                <option value="nonveg">Non-Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
              </select>
              <input
                name="doctorConstraints"
                value={formData.doctorConstraints || ""}
                onChange={handleChange}
                className="input"
                placeholder="Doctor Constraints"
              />
              <div className="flex gap-4 mt-4">
                <button onClick={handleUpdate} className="btn-primary">
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
