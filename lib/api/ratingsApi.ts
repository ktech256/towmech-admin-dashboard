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

const ADMIN_RATINGS_BASE = "/api/admin/ratings"; // ✅ FIX

export async function getAdminRatings(query: AdminRatingsQuery = {}) {
  const res = await api.get<AdminRatingsResponse>(ADMIN_RATINGS_BASE, { params: query });
  return res.data;
}