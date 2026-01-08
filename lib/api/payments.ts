import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchPayments() {
  return api.get("/api/admin/payments", {
    headers: getAuthHeader(),
  });
}

export async function fetchPayouts() {
  return api.get("/api/admin/payouts", {
    headers: getAuthHeader(),
  });
}
