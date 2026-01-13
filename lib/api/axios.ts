// lib/api/axios.ts
import axios from "axios";

/**
 * You should set this in Render for the admin dashboard:
 * NEXT_PUBLIC_API_BASE_URL = https://towmech-main.onrender.com/api
 *
 * Then your calls should be like:
 *   api.get("/admin/overview/summary")
 *   api.post("/auth/login")
 */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function normalizeBaseUrl(url: string) {
  let u = (url || "").trim();
  if (!u) return u;

  // remove trailing slashes
  u = u.replace(/\/+$/, "");

  return u;
}

const baseURL = normalizeBaseUrl(RAW_BASE);

const api = axios.create({
  baseURL,
});

// ✅ Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;