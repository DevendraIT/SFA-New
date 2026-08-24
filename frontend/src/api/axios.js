import axios from "axios";
import { STORAGE_KEYS } from "../config/constants";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION}`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (token && token !== "undefined" && token !== "null") {
    if (config.headers?.set) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }

    return Promise.reject(error);
  }
);

export default api;