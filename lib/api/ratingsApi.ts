// lib/api/ratingsApi.ts
import api from "@/lib/api/axios";

export type RatingItem = {
  _id: string;
  job?: { _id: string; title?: string } | string;

  rater?: { _id: string; name?: string; email?: string; role?: string } | string;
  target?: { _id: string; name?: string; email?: string; role?: string } | string;

  rating: number;
  comment?: string | null;

  raterRole?: string;
  targetRole?: string;

  createdAt: string;
};

export type RatingsListResponse = {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  ratings: RatingItem[];
};

// ✅ baseURL already includes /api, so use /admin/... here
const ADMIN_RATINGS_BASE = "/admin/ratings";

export async function fetchAdminRatings(params?: {
  page?: number;
  limit?: number;
  search?: string;
  minStars?: number;
  maxStars?: number;
}) {
  const { page = 1, limit = 20, search = "", minStars, maxStars } = params || {};

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  if (search) query.set("search", search);
  if (typeof minStars === "number") query.set("minStars", String(minStars));
  if (typeof maxStars === "number") query.set("maxStars", String(maxStars));

  const url = `${ADMIN_RATINGS_BASE}?${query.toString()}`;
  const res = await api.get<RatingsListResponse>(url);
  return res.data;
}

export async function fetchAdminRatingById(id: string) {
  const res = await api.get(`${ADMIN_RATINGS_BASE}/${id}`);
  return res.data;
}