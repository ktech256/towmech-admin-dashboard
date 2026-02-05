// dashboard/lib/api/insurance.ts
import api from "./axios";

export type InsurancePartner = {
  _id: string;
  name: string;
  partnerCode?: string;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  countryCodes?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type InsuranceCode = {
  _id: string;
  partner?: { _id?: string; name?: string; partnerCode?: string };
  countryCode: string;
  code: string;
  isActive?: boolean;
  expiresAt?: string | null;
  usage?: {
    usedCount?: number;
    maxUses?: number;
    lastUsedAt?: string | null;
  };
  createdAt?: string;
};

export type InvoiceSummary = {
  partnerId: string;
  countryCode: string;
  month: string;
  currency: string;
  totalJobs: number;
  totalAmount: number;
  items: Array<{
    jobId: string;
    createdAt: string;
    pickupAddressText?: string | null;
    dropoffAddressText?: string | null;
    amount: number;
    currency: string;
    paidAmount?: number;
  }>;
};

/**
 * ============================
 * PARTNERS (ADMIN)
 * ============================
 */

export async function getInsurancePartners(params?: { countryCode?: string }) {
  const res = await api.get("/admin/insurance/partners", { params });
  return (res.data?.partners || []) as InsurancePartner[];
}

export async function createInsurancePartner(payload: {
  name: string;
  partnerCode: string;
  countryCodes: string[];
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}) {
  const res = await api.post("/admin/insurance/partners", payload);
  return res.data?.partner as InsurancePartner;
}

export async function updateInsurancePartner(
  partnerId: string,
  payload: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
    description: string | null;
    countryCodes: string[];
    isActive: boolean;
  }>
) {
  const res = await api.patch(`/admin/insurance/partners/${partnerId}`, payload);
  return res.data?.partner as InsurancePartner;
}

/**
 * ============================
 * CODES (ADMIN)
 * ============================
 */

export async function getInsuranceCodes(params: { partnerId: string; countryCode: string }) {
  const res = await api.get("/admin/insurance/codes", { params });
  return (res.data?.codes || []) as InsuranceCode[];
}

export async function generateInsuranceCodes(payload: {
  partnerId: string;
  countryCode: string;
  count: number;
  length?: number;
  expiresInDays?: number;
  maxUses?: number;
}) {
  const res = await api.post("/admin/insurance/codes/generate", payload);
  return res.data;
}

export async function disableInsuranceCode(codeId: string) {
  const res = await api.patch(`/admin/insurance/codes/${codeId}/disable`);
  return res.data;
}

/**
 * ============================
 * INVOICE (ADMIN)
 * ============================
 */

export async function getInsuranceInvoice(params: {
  partnerId: string;
  countryCode: string;
  month: string; // YYYY-MM
}) {
  const res = await api.get("/admin/insurance/invoice", { params });
  return res.data?.invoice as InvoiceSummary;
}