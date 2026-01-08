import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchPricing() {
  return api.get("/api/admin/pricing", {
    headers: getAuthHeader(),
  });
}

export async function updatePricing(payload: Record<string, unknown>) {
  return api.post("/api/admin/pricing", payload, {
    headers: getAuthHeader(),
  });
}
