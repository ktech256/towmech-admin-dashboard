import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchAdminTickets(params?: {
  status?: string;
  type?: string;
  priority?: string;
}) {
  const res = await api.get("/api/admin/support/tickets", {
    headers: getAuthHeader(),
    params,
  });
  return res.data;
}

export async function assignTicket(ticketId: string, adminId?: string) {
  const res = await api.patch(
    `/api/admin/support/tickets/${ticketId}/assign`,
    { adminId },
    { headers: getAuthHeader() }
  );
  return res.data;
}

export async function updateTicket(
  ticketId: string,
  payload: { status?: string; adminNote?: string }
) {
  const res = await api.patch(
    `/api/admin/support/tickets/${ticketId}/update`,
    payload,
    { headers: getAuthHeader() }
  );
  return res.data;
}
