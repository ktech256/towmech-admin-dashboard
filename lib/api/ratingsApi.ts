import api from "./axios";

export type AdminRatingsQuery = {
  page?: number;
  limit?: number;

  // UI uses "search", backend may use "q"
  search?: string;
  q?: string;

  minStars?: number;
  maxStars?: number;
};

export type RatingItem = {
  _id: string;
  job?: string;
  rater?: any;
  target?: any;
  raterRole?: string;
  targetRole?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
};

export type AdminRatingsResponse = {
  items: RatingItem[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const ADMIN_RATINGS_BASE = "/api/admin/ratings";

/**
 * ✅ List ratings (table)
 */
export async function getAdminRatings(query: AdminRatingsQuery = {}) {
  // Normalize: if UI sends "search", convert to "q" for backend.
  const params: AdminRatingsQuery = {
    ...query,
    q: (query.q ?? query.search ?? "").trim() || undefined,
  };

  // Optional: also keep "search" off the request if backend doesn't expect it
  delete (params as any).search;

  const res = await api.get<AdminRatingsResponse>(ADMIN_RATINGS_BASE, { params });
  return res.data;
}

/**
 * ✅ Get rating by id (details modal)
 */
export async function getAdminRatingById(id: string) {
  if (!id) throw new Error("Rating id is required");
  const res = await api.get<{ rating: RatingItem }>(`${ADMIN_RATINGS_BASE}/${id}`);
  return res.data;
}

/**
 * ✅ Compatibility exports (match what components import)
 */
export async function fetchAdminRatings(query: AdminRatingsQuery = {}) {
  return getAdminRatings(query);
}

export async function fetchRatings(query: AdminRatingsQuery = {}) {
  return getAdminRatings(query);
}

export async function fetchAdminRatingById(id: string) {
  return getAdminRatingById(id);
}