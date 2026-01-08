import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchSupportTickets() {
  return api.get("/api/admin/support", {
    headers: getAuthHeader(),
  });
}

export async function fetchDisputes() {
  return api.get("/api/admin/disputes", {
    headers: getAuthHeader(),
  });
}
