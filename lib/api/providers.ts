import api from "@/lib/api/axios";

export async function fetchPendingProviders() {
  const res = await api.get("/api/admin/providers/providers/pending");
  return res.data;
}

export async function fetchApprovedProviders() {
  const res = await api.get("/api/admin/providers/providers/approved");
  return res.data;
}

export async function fetchRejectedProviders() {
  const res = await api.get("/api/admin/providers/providers/rejected");
  return res.data;
}

export async function fetchProviderVerification(id: string) {
  const res = await api.get(`/api/admin/providers/providers/${id}/verification`);
  return res.data;
}

export async function approveProvider(id: string) {
  const res = await api.patch(`/api/admin/providers/providers/${id}/approve`);
  return res.data;
}

export async function rejectProvider(id: string) {
  const res = await api.patch(`/api/admin/providers/providers/${id}/reject`);
  return res.data;
}

export async function approveProviderDoc(id: string, field: string) {
  const res = await api.patch(`/api/admin/providers/providers/${id}/documents/${field}/approve`);
  return res.data;
}

export async function rejectProviderDoc(id: string, field: string, reason: string) {
  const res = await api.patch(`/api/admin/providers/providers/${id}/documents/${field}/reject`, { reason });
  return res.data;
}

export async function finalApproveProvider(id: string) {
  const res = await api.patch(`/api/admin/providers/providers/${id}/final-approve`);
  return res.data;
}
