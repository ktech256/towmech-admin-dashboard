import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

// Your Render env already includes /api, so baseURL should be:
// https://towmech-main.onrender.com/api
const api = axios.create({
  baseURL: API_BASE.replace(/\/$/, ""),
});

export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  const res = await api.post("/auth/login", payload);
  return res.data; // { message, token? } OR { message, otp?, requiresOtp? }
}

export async function verifyOtp(payload: { phone: string; otp: string }) {
  const res = await api.post("/auth/verify-otp", payload);
  return res.data; // { message, token, user }
}