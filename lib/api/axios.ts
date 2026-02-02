// lib/api/axios.ts
import axios from "axios";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function buildApiBaseUrl(input: string) {
  const trimmed = String(input || "").trim().replace(/\/+$/, "");
  if (trimmed.toLowerCase().endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

const API_BASE = buildApiBaseUrl(RAW_API_BASE);

function getCountryCode(): string {
  if (typeof window === "undefined") return "ZA";
  const v = (localStorage.getItem("countryCode") || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : "ZA";
}

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

  // token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // ✅ country workspace header (single source of truth)
    config.headers = config.headers || {};
    (config.headers as any)["X-COUNTRY-CODE"] = getCountryCode();
  }

  return config;
});

export default api;