import api from "@/lib/api/axios";

export async function fetchOverviewSummary() {
  const res = await api.get("/api/admin/overview/summary");
  return res.data;
}