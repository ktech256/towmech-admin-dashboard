import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchRoles() {
  return api.get("/api/admin/roles", {
    headers: getAuthHeader(),
  });
}

export async function updateRole(id: string, payload: Record<string, unknown>) {
  return api.put(`/api/admin/roles/${id}`, payload, {
    headers: getAuthHeader(),
  });
}
