import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE });

export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

export async function verifyOtp(payload: {
  phone: string;
  otp: string;
}) {
  const res = await api.post("/api/auth/verify-otp", payload);
  return res.data;
}