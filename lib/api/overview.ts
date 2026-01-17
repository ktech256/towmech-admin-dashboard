import api from "./axios";

export async function getOverviewSummary() {
  // ✅ FIX: backend routes are under /api
  const res = await api.get("/api/admin/overview/summary");
  return res.data;
}