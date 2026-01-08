import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchUsers() {
  return api.get("/api/admin/users", {
    headers: getAuthHeader(),
  });
}

export async function fetchUserById(id: string) {
  return api.get(`/api/admin/users/${id}`, {
    headers: getAuthHeader(),
  });
}
