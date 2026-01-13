import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/**
 * Normalize base URL so we don't end up with:
 *   https://towmech-main.onrender.com/api/api/...
 */
function normalizeBaseUrl(url: string) {
  let u = (url || "").trim();
  if (!u) return u;

  // remove trailing slash
  u = u.replace(/\/+$/, "");

  // if it ends with /api, keep it; otherwise keep as is
  return u;
}

const baseURL = normalizeBaseUrl(API_BASE);

export const api = axios.create({
  baseURL,
});

/**
 * ✅ Always attach token (adminToken OR token)
 */
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

export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  // If baseURL already includes /api, call "/auth/login"
  // If baseURL is root, call "/api/auth/login"
  const path = baseURL.endsWith("/api") ? "/auth/login" : "/api/auth/login";

  const res = await api.post(path, payload);
  return res.data;
}

export async function verifyOtp(payload: { phone: string; otp: string }) {
  const path = baseURL.endsWith("/api") ? "/auth/verify-otp" : "/api/auth/verify-otp";

  const res = await api.post(path, payload);
  return res.data;
}