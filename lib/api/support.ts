// lib/api/support.ts
import api from "@/lib/api/axios";

export async function fetchAdminTickets(params?: {
  status?: string;
  type?: string;
  priority?: string;
}) {
  const res = await api.get("/api/admin/support/tickets", { params });
  return res.data;
}

export async function assignTicket(ticketId: string, adminId?: string) {
  const res = await api.patch(`/api/admin/support/tickets/${ticketId}/assign`, {
    adminId,
  });
  return res.data;
}

export async function updateTicket(
  ticketId: string,
  payload: { status?: string; adminNote?: string }
) {
  const res = await api.patch(
    `/api/admin/support/tickets/${ticketId}/update`,
    payload
  );
  return res.data;
}

// ✅ NEW: fetch single ticket (to refresh modal after saving reply)
export async function fetchAdminTicketById(ticketId: string) {
  // backend does not currently expose /api/admin/support/tickets/:id
  // so we fetch all and pick one (safe fallback; no backend changes)
  const data = await fetchAdminTickets();
  const tickets = data?.tickets || [];
  return tickets.find((t: any) => t?._id === ticketId) || null;
}