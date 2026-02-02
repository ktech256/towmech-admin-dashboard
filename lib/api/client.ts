import axios from "axios";

function getCountryCode(): string {
  if (typeof window === "undefined") return "ZA";
  return (localStorage.getItem("towmech_country") || "ZA").toUpperCase();
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["X-COUNTRY-CODE"] = getCountryCode();
  return config;
});