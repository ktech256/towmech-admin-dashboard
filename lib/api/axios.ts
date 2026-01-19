// lib/api/axios.ts
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  // ✅ prevents "localStorage is not defined" during build/SSR
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;