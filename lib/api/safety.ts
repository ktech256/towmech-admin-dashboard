import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchSafetyIncidents() {
  return api.get("/api/admin/safety", {
    headers: getAuthHeader(),
  });
}

export async function updateSafetyPolicy(payload: Record<string, unknown>) {
  return api.post("/api/admin/safety/policy", payload, {
    headers: getAuthHeader(),
  });
}
