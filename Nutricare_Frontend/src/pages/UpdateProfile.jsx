import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function UpdateProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    foodPreference: "",
    medicalConditions: [],
    allergies: [],
    doctorConstraints: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/getUser");
        if (res.data.data) {
          setFormData(res.data.data);
        }
      } catch (err) {
        setError("Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updated = checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value);
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.patch("/user/updateUser", {
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        foodPreference: formData.foodPreference,
        medicalConditions: formData.medicalConditions,
        allergies: formData.allergies,
        doctorConstraints: formData.doctorConstraints,
      });
      setSuccess("Profile updated successfully!");
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-semibold text-teal-600 mb-6">
        Update Your Profile
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 card">
        <input
          name="age"
          value={formData.age}
          onChange={handleChange}
          className="input"
          placeholder="Age"
          type="number"
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="input"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          name="height"
          value={formData.height}
          onChange={handleChange}
          className="input"
          placeholder="Height (cm)"
          type="number"
        />
        <select
          name="foodPreference"
          value={formData.foodPreference}
          onChange={handleChange}
          className="input"
        >
          <option value="">Select Food Preference</option>
          <option value="veg">Vegetarian</option>
          <option value="nonveg">Non-Vegetarian</option>
          <option value="eggetarian">Eggetarian</option>
        </select>

        <div>
          <label className="block font-medium mb-2">Medical Conditions</label>
          {[
            "diabetes",
            "hypertension",
            "heart_disease",
            "obesity",
            "thyroid_disorder",
            "pcos",
            "gastritis",
            "anemia",
            "kidney_disease",
          ].map((cond) => (
            <label key={cond} className="block text-sm text-gray-600">
              <input
                type="checkbox"
                value={cond}
                checked={formData.medicalConditions.includes(cond)}
                onChange={(e) => handleCheckboxChange(e, "medicalConditions")}
              />{" "}
              {cond}
            </label>
          ))}
        </div>

        <div>
          <label className="block font-medium mb-2">Allergies</label>
          {[
            "milk",
            "peanuts",
            "tree_nuts",
            "eggs",
            "soy",
            "gluten",
            "seafood",
          ].map((allergy) => (
            <label key={allergy} className="block text-sm text-gray-600">
              <input
                type="checkbox"
                value={allergy}
                checked={formData.allergies.includes(allergy)}
                onChange={(e) => handleCheckboxChange(e, "allergies")}
              />{" "}
              {allergy}
            </label>
          ))}
        </div>

        <input
          name="doctorConstraints"
          value={formData.doctorConstraints}
          onChange={handleChange}
          className="input"
          placeholder="Doctor Constraints"
        />

        <button type="submit" className="btn-primary">
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
