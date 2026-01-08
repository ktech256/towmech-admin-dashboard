import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchNotifications() {
  return api.get("/api/admin/notifications", {
    headers: getAuthHeader(),
  });
}

export async function sendNotification(payload: Record<string, unknown>) {
  return api.post("/api/admin/notifications", payload, {
    headers: getAuthHeader(),
  });
}
