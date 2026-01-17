import api from "./axios";

export type AdminRatingsQuery = {
  page?: number;
  limit?: number;
  minStars?: number;
  maxStars?: number;
  q?: string;
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
  const res = await api.get<AdminRatingsResponse>(ADMIN_RATINGS_BASE, {
    params: query,
  });
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