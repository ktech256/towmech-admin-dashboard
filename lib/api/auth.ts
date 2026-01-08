import api, { getAuthHeader } from "@/lib/api/axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export async function login(payload: LoginPayload) {
  return api.post("/api/auth/login", payload);
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  return api.post("/api/auth/verify-otp", payload);
}

export async function getProfile() {
  return api.get("/api/admin/profile", {
    headers: getAuthHeader(),
  });
}
