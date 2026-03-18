import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8001/api/v1";

/**
 * Shared HTTP client.
 * Backend auth is cookie-based, so `withCredentials` must stay enabled.
 */
export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error) {
  // Backend uses ApiError: { statusCode, message, success:false, errors:[] }
  const msg =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  return String(msg);
}

