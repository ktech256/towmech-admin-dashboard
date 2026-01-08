import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchProviders() {
  return api.get("/api/admin/providers", {
    headers: getAuthHeader(),
  });
}

export async function fetchProviderById(id: string) {
  return api.get(`/api/admin/providers/${id}`, {
    headers: getAuthHeader(),
  });
}
