// lib/api/axios.ts
import axios from "axios";

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

// Normalize: remove trailing slashes
const BASE = RAW_BASE.replace(/\/+$/, "");

// Ensure baseURL always includes exactly ONE "/api" at the end.
// - If user sets https://api.towmech.com  -> becomes https://api.towmech.com/api
// - If user sets https://api.towmech.com/api -> stays https://api.towmech.com/api
const API_BASE = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

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
