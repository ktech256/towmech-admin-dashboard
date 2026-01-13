// lib/api/auth.ts
import api from "@/lib/api/axios";

export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  const res = await api.post("/auth/login", payload);
  return res.data;
}

export async function verifyOtp(payload: {
  phone: string;
  otp: string;
}) {
  const res = await api.post("/auth/verify-otp", payload);
  return res.data;
}