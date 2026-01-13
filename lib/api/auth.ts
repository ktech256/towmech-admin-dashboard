import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api"; // local fallback

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ✅ Login (phone + password)
export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  const res = await api.post("/auth/login", payload);
  return res.data; // { message, otp?, requiresOtp?, token?, user? }
}

// ✅ Verify OTP
export async function verifyOtp(payload: { phone: string; otp: string }) {
  const res = await api.post("/auth/verify-otp", payload);
  return res.data; // { message, token, user }
}