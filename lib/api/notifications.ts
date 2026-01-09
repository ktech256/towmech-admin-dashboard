import api, { getAuthHeader } from "@/lib/api/axios";

export type BroadcastPayload = {
  audience: "ALL" | "CUSTOMERS" | "PROVIDERS";
  providerRole?: "ALL" | "TOW_TRUCK" | "MECHANIC";
  title: string;
  body: string;
};

export async function broadcastNotification(payload: BroadcastPayload) {
  const res = await api.post("/api/admin/notifications/broadcast", payload, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function fetchNotificationLogs() {
  const res = await api.get("/api/admin/notifications/logs", {
    headers: getAuthHeader(),
  });
  return res.data;
}
