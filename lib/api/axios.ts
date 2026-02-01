// lib/api/axios.ts
import axios from "axios";
import { useCountryStore } from "@/lib/store/countryStore";

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
  const trimmed = String(input || "").trim().replace(/\/+$/, "");

  if (trimmed.toLowerCase().endsWith("/api")) return trimmed;

  return `${trimmed}/api`;
}

const API_BASE = buildApiBaseUrl(RAW_API_BASE);

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  // prevent double "/api/api"
  if (config.url && typeof config.url === "string") {
    if (API_BASE.toLowerCase().endsWith("/api") && config.url.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api/, "");
    }
  }

  // ✅ token (client only)
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ country header (client only)
    try {
      const countryCode = useCountryStore.getState()?.countryCode;
      if (countryCode) {
        config.headers = config.headers || {};
        (config.headers as any)["X-COUNTRY-CODE"] = countryCode;
      }
    } catch {
      // ignore
    }
  }

  return config;
});

export default api;