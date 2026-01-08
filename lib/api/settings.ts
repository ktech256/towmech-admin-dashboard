import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchSettings() {
  return api.get("/api/admin/settings", {
    headers: getAuthHeader(),
  });
}

export async function updateSettings(payload: Record<string, unknown>) {
  return api.put("/api/admin/settings", payload, {
    headers: getAuthHeader(),
  });
}
