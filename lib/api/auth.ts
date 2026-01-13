// lib/api/auth.ts
import api from "@/lib/api/axios";

export type LoginResponse = {
  message?: string;
  requiresOtp?: boolean;
  otp?: string; // only if debug enabled
  token?: string;
  user?: any;
};

function saveAdminToken(token?: string) {
  if (typeof window === "undefined") return;
  if (!token) return;

  // ✅ use ONE consistent key for dashboard
  localStorage.setItem("adminToken", token);

  // optional compatibility
  localStorage.setItem("token", token);
}

export async function loginWithPhonePassword(payload: {
  phone: string;
  password: string;
}) {
  // baseURL includes /api, so DON'T include /api again
  const res = await api.post<LoginResponse>("/auth/login", payload);

  // If backend ever returns token directly, save it
  saveAdminToken(res.data?.token);

  return res.data;
}

export async function verifyOtp(payload: { phone: string; otp: string }) {
  const res = await api.post<LoginResponse>("/auth/verify-otp", payload);

  // ✅ OTP verify returns token -> save it
  saveAdminToken(res.data?.token);

  return res.data;
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("token");
}