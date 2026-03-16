import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1", // your backend base URL
  withCredentials: true, // for cookie-based auth
});

export default api;
