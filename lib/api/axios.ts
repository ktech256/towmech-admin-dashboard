import axios from "axios";

const api = axios.create({
  baseURL: "https://towmech-main.onrender.com",
});

export const getAuthHeader = () => {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("towmech_token");
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export default api;
