import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchAdminPayments() {
  const res = await api.get("/api/admin/payments", {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function fetchPaymentById(id: string) {
  const res = await api.get(`/api/admin/payments/${id}`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function refundPayment(id: string) {
  const res = await api.patch(
    `/api/admin/payments/${id}/refund`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
}

/**
 * ✅ Manual payment override
 * PATCH /api/payments/job/:jobId/mark-paid
 */
export async function markPaymentPaid(jobId: string) {
  const res = await api.patch(
    `/api/payments/job/${jobId}/mark-paid`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
}
