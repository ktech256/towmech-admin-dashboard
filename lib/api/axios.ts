// lib/api/axios.ts
import axios from "axios";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

/**
 * Normalize API base so that:
 * - If env is https://api.towmech.com  -> baseURL becomes https://api.towmech.com/api
 * - If env is https://api.towmech.com/api -> baseURL stays https://api.towmech.com/api
 * - If env has trailing slash -> it is removed
 */
function buildApiBaseUrl(input: string) {
  const trimmed = String(input || "").trim().replace(/\/+$/, ""); // remove trailing slashes

  // If already ends with /api (or /api/), keep it.
  if (trimmed.toLowerCase().endsWith("/api")) return trimmed;

  // Otherwise append /api
  return `${trimmed}/api`;
}

const API_BASE = buildApiBaseUrl(RAW_API_BASE);

const api = axios.create({
  baseURL: API_BASE,
});

// ✅ Optional safety: if any code mistakenly calls "/api/xxx",
// this prevents double "/api/api/xxx".
api.interceptors.request.use((config) => {
  if (config.url && typeof config.url === "string") {
    if (API_BASE.toLowerCase().endsWith("/api") && config.url.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api/, "");
    }
  }

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
