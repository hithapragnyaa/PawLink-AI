
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const getAccessToken = () =>
  sessionStorage.getItem("pawlink_access_token");

export const saveSession = (accessToken, user) => {
  sessionStorage.setItem("pawlink_access_token", accessToken);
  sessionStorage.setItem("pawlink_user", JSON.stringify(user));
};

export const clearSession = () => {
  sessionStorage.removeItem("pawlink_access_token");
  sessionStorage.removeItem("pawlink_user");
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error.response?.data?.message ||
  (error.code === "ECONNABORTED"
    ? "The server took too long to respond. Please try again."
    : "Unable to connect to PawLink AI. Check that the backend is running.");
