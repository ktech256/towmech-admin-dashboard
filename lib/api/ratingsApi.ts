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

/**
 * ✅ Backend may return:
 * { items: [...] }
 *
 * UI expects:
 * { ratings: [...] }
 *
 * So we support BOTH to stop TS errors + avoid changing UI files.
 */
export type AdminRatingsResponse = {
  items?: RatingItem[];
  ratings?: RatingItem[];

  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
};

const ADMIN_RATINGS_BASE = "/api/admin/ratings";

/**
 * ✅ List ratings (table)
 */
export async function getAdminRatings(query: AdminRatingsQuery = {}) {
  const params: any = {
    ...query,
    q: (query.q ?? query.search ?? "").trim() || undefined,
  };

  // Remove search so backend doesn't reject unknown params
  delete params.search;

  const res = await api.get<AdminRatingsResponse>(ADMIN_RATINGS_BASE, { params });

  const data = res.data || {};

  // ✅ Normalize response so UI always gets "ratings"
  const normalized: AdminRatingsResponse = {
    ...data,
    items: data.items ?? data.ratings ?? [],
    ratings: data.ratings ?? data.items ?? [],
  };

  return normalized;
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