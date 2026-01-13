// lib/api/overview.ts
import api from "@/lib/api/axios";

export async function fetchOverviewSummary() {
  // baseURL includes /api, so this must be /admin/... not /api/admin/...
  const res = await api.get("/admin/overview/summary");
  return res.data;
}