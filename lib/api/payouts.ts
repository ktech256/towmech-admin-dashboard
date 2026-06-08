import api from "./axios";

export async function downloadWeeklyStatementPdf(payoutId: string) {
  const res = await api.get(`/payouts/admin/${payoutId}/statement/pdf`, {
    responseType: "blob",
  });
  return res.data;
}

export async function downloadMonthlyStatementPdf(providerId: string, month: string) {
    // This endpoint doesn't exist yet, but planned
  const res = await api.get(`/payouts/admin/provider/${providerId}/monthly-statement/pdf`, {
    params: { month },
    responseType: "blob",
  });
  return res.data;
}
