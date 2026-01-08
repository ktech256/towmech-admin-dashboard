import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchAnalyticsOverview() {
  return api.get("/api/admin/analytics/overview", {
    headers: getAuthHeader(),
  });
}

export async function fetchAnalyticsTrends() {
  return api.get("/api/admin/analytics/trends", {
    headers: getAuthHeader(),
  });
}
