import api from "@/lib/api/axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export async function login(payload: LoginPayload) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const res = await api.post("/api/auth/verify-otp", payload);
  return res.data; // should contain token + user
}

export async function getProfile() {
  const res = await api.get("/api/auth/profile");
  return res.data;
}
