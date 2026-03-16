import axios from "axios";

const API_URL = "http://localhost:5000/api/v1/auth";

export const loginAdmin = async ({ email, password }) => {
  try {
    const res = await axios.post(
      `${API_URL}/login`,
      {
        email,
        password,
        userType: "Admin", // 🔥 HARD-CODED AS REQUIRED
      },
      {
        withCredentials: true, // 🔥 REQUIRED FOR COOKIES
      },
    );

    return res.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data.message || "Invalid credentials";
    } else if (error.request) {
      throw "Server not responding";
    } else {
      throw "Something went wrong";
    }
  }
};
