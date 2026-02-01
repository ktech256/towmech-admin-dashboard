// lib/api/insurance.ts
import api from "./axios";

export type InsurancePartner = {
  _id: string;

  name: string; // e.g. "Old Mutual", "Jubilee", etc
  countryCode: string; // ZA / KE / UG / etc

  isActive: boolean;

  // optional branding / display
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;

  // billing
  billingCycle?: "MONTHLY" | "WEEKLY" | "CUSTOM";
  billingEmail?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type InsuranceCode = {
  _id: string;

  partnerId: string;
  partnerName?: string;

  countryCode: string;

  code: string; // unique code given to client
  isUsed: boolean;

  usedByJobId?: string | null;
  usedByCustomerId?: string | null;

  expiresAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type InsuranceUsageSummary = {
  partnerId: string;
  partnerName: string;
  countryCode: string;

  periodStart: string;
  periodEnd: string;

  totalJobs: number;
  totalDistanceKm?: number;
  totalAmount?: number;

  jobs: Array<{
    jobId: string;
    createdAt: string;
    customerName?: string;
    pickupAddressText?: string | null;
    dropoffAddressText?: string | null;
    providerName?: string | null;
    estimatedDistanceKm?: number;
    amount?: number;
    currency?: string;
  }>;
};

/**
 * ============================
 * PARTNERS
 * ============================
 */

export async function getInsurancePartners(params?: {
  countryCode?: string;
  isActive?: boolean;
}): Promise<InsurancePartner[]> {
  const res = await api.get("/api/admin/insurance/partners", { params });
  return res.data?.partners || [];
}

export async function createInsurancePartner(payload: {
  name: string;
  countryCode: string;
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  billingCycle?: "MONTHLY" | "WEEKLY" | "CUSTOM";
  billingEmail?: string | null;
}): Promise<InsurancePartner> {
  const res = await api.post("/api/admin/insurance/partners", payload);
  return res.data?.partner;
}

export async function updateInsurancePartner(
  partnerId: string,
  payload: Partial<{
    name: string;
    countryCode: string;
    isActive: boolean;
    logoUrl: string | null;
    supportEmail: string | null;
    supportPhone: string | null;
    billingCycle: "MONTHLY" | "WEEKLY" | "CUSTOM";
    billingEmail: string | null;
  }>
): Promise<InsurancePartner> {
  const res = await api.patch(`/api/admin/insurance/partners/${partnerId}`, payload);
  return res.data?.partner;
}

export async function setInsurancePartnerActive(
  partnerId: string,
  isActive: boolean
): Promise<InsurancePartner> {
  const res = await api.patch(`/api/admin/insurance/partners/${partnerId}/active`, { isActive });
  return res.data?.partner;
}

export async function deleteInsurancePartner(partnerId: string): Promise<{ ok: boolean }> {
  const res = await api.delete(`/api/admin/insurance/partners/${partnerId}`);
  return { ok: !!res.data?.ok };
}

/**
 * ============================
 * CODES
 * ============================
 */

export async function getInsuranceCodes(params?: {
  partnerId?: string;
  countryCode?: string;
  isUsed?: boolean;
}): Promise<InsuranceCode[]> {
  const res = await api.get("/api/admin/insurance/codes", { params });
  return res.data?.codes || [];
}

export async function generateInsuranceCodes(payload: {
  partnerId: string;
  quantity: number; // how many codes to generate
  expiresAt?: string | null;
}): Promise<{ codes: InsuranceCode[] }> {
  const res = await api.post("/api/admin/insurance/codes/generate", payload);
  return { codes: res.data?.codes || [] };
}

export async function revokeInsuranceCode(codeId: string): Promise<{ ok: boolean }> {
  const res = await api.delete(`/api/admin/insurance/codes/${codeId}`);
  return { ok: !!res.data?.ok };
}

/**
 * ============================
 * USAGE + INVOICING
 * ============================
 */

export async function getInsuranceUsageSummary(params: {
  partnerId: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
}): Promise<InsuranceUsageSummary> {
  const res = await api.get("/api/admin/insurance/usage-summary", { params });
  return res.data?.summary;
}

/**
 * ============================
 * PUBLIC (APP)
 * ============================
 */

export async function getPublicInsurancePartners(countryCode: string): Promise<InsurancePartner[]> {
  const res = await api.get("/api/insurance/partners", { params: { countryCode } });
  return res.data?.partners || [];
}

export async function validateInsuranceCode(payload: {
  countryCode: string;
  partnerId: string;
  code: string;
}): Promise<{ valid: boolean; message?: string }> {
  const res = await api.post("/api/insurance/validate-code", payload);
  return res.data;
}