import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timed out. Please try again."));
    }

    if (error.response?.status >= 500) {
      return Promise.reject(
        new Error("Backend service is currently unavailable.")
      );
    }

    if (error.request) {
      return Promise.reject(
        new Error(`Unable to reach the backend at ${API_BASE_URL}.`)
      );
    }

    return Promise.reject(
      new Error(error.message || "Unexpected API error occurred.")
    );
  }
);

export async function createWebCall() {
  const response = await api.post("/api/retell/create-web-call");

  if (!response.data?.success || !response.data?.accessToken) {
    throw new Error("The backend did not return a valid Retell access token.");
  }

  return response.data;
}

export default api;
