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

/**
 * ✅ Allow job to be either:
 * - string id
 * - populated object (title/_id)
 * - null/undefined
 */
export type RatingJobRef =
  | string
  | {
      _id?: string;
      title?: string;
      [key: string]: any;
    }
  | null
  | undefined;

export type RatingItem = {
  _id: string;

  // ✅ was: job?: string;
  job?: RatingJobRef;

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

  // ✅ Normalize so UI always gets "ratings"
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