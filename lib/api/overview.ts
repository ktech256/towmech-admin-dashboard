import api from "@/lib/api/axios";

export async function fetchOverviewSummary() {
  // baseURL ends with /api, so this should NOT start with /api
  const res = await api.get("/admin/overview/summary");
  return res.data;
}