import api, { getAuthHeader } from "@/lib/api/axios";

export async function fetchJobs() {
  return api.get("/api/admin/jobs", {
    headers: getAuthHeader(),
  });
}

export async function fetchJobById(id: string) {
  return api.get(`/api/admin/jobs/${id}`, {
    headers: getAuthHeader(),
  });
}
