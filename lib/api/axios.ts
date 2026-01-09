import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://towmech-main.onrender.com",
});

/**
 * ✅ Helper: get auth header manually (used in some requests)
 */
export const getAuthHeader = () => {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("towmech_token");
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};

// ✅ Automatically attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("towmech_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Handle token expiry or unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem("towmech_token");
        localStorage.removeItem("towmech_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
