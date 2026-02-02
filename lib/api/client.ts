// lib/api/client.ts
import axios from "axios";

const STORAGE_KEY = "countryCode";

function normalizeIso2(v: any) {
  const code = String(v || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "ZA";
}

function getCountryCode(): string {
  if (typeof window === "undefined") return "ZA";
  return normalizeIso2(localStorage.getItem(STORAGE_KEY) || "ZA");
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  (config.headers as any)["X-COUNTRY-CODE"] = getCountryCode();
  return config;
});