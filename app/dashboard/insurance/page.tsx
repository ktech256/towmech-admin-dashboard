"use client";

import React, { useEffect, useMemo, useState } from "react";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
};

type InsurancePartner = {
  _id: string;
  countryCode?: string;
  name: string;

  // ✅ NEW (Option A)
  partnerCode?: string;

  // legacy/older dashboard fields
  contactEmail?: string | null;
  contactPhone?: string | null;
  billingEmail?: string | null;

  // newer backend fields (safe optional)
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  countryCodes?: string[];

  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type InsuranceCode = {
  _id: string;
  partnerId?: string;
  partner?: { _id?: string; name?: string; partnerCode?: string; code?: string };

  countryCode: string;
  code: string;

  // legacy dashboard status
  status?: "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";

  // newer backend status fields
  isActive?: boolean;
  expiresAt?: string | null;
  usage?: {
    usedCount?: number;
    maxUses?: number;
    lastUsedAt?: string | null;
  };

  usedByJobId?: string | null;
  usedAt?: string | null;
  createdAt?: string;
};

type InvoiceSummary = {
  partnerId: string;
  countryCode: string;
  month: string; // YYYY-MM
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
  }>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function authHeaders(extra: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

const MONTHS = (() => {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    list.push(`${d.getFullYear()}-${mm}`);
  }
  return list;
})();

export default function InsurancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");

  const [partners, setPartners] = useState<InsurancePartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  const selectedPartner = useMemo(
    () => partners.find((p) => p._id === selectedPartnerId) || null,
    [partners, selectedPartnerId]
  );

  const [codes, setCodes] = useState<InsuranceCode[]>([]);
  const [codeStatusFilter, setCodeStatusFilter] = useState<
    "ALL" | "ACTIVE" | "USED" | "EXPIRED" | "REVOKED"
  >("ALL");

  // Create partner form
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerCode, setNewPartnerCode] = useState(""); // ✅ NEW
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerPhone, setNewPartnerPhone] = useState("");

  // Generate codes
  const [generateCount, setGenerateCount] = useState<number>(50);

  // Invoice
  const [invoiceMonth, setInvoiceMonth] = useState<string>(MONTHS[0]);
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);

  async function loadCountries() {
    const res = await fetch(`${API_BASE}/api/admin/countries`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || "Failed to load countries");
    }

    const data = await res.json();
    const list: Country[] = Array.isArray(data?.countries) ? data.countries : [];
    setCountries(list);

    if (!selectedCountryCode && list.length > 0) {
      setSelectedCountryCode(list[0].code);
    }
  }

  async function loadPartners(countryCode: string) {
    const res = await fetch(
      `${API_BASE}/api/admin/insurance/partners?countryCode=${encodeURIComponent(
        countryCode
      )}`,
      {
        method: "GET",
        headers: authHeaders({ "X-COUNTRY-CODE": countryCode }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load partners");

    const list: InsurancePartner[] = Array.isArray(data?.partners)
      ? data.partners
      : [];

    setPartners(list);

    if (!selectedPartnerId && list.length > 0) {
      setSelectedPartnerId(list[0]._id);
    } else if (
      selectedPartnerId &&
      !list.some((p) => p._id === selectedPartnerId)
    ) {
      setSelectedPartnerId(list[0]?._id || "");
    }
  }

  async function loadCodes(countryCode: string, partnerId: string) {
    if (!partnerId) {
      setCodes([]);
      return;
    }

    const res = await fetch(
      `${API_BASE}/api/admin/insurance/codes?countryCode=${encodeURIComponent(
        countryCode
      )}&partnerId=${encodeURIComponent(partnerId)}`,
      {
        method: "GET",
        headers: authHeaders({ "X-COUNTRY-CODE": countryCode }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load codes");

    const list: InsuranceCode[] = Array.isArray(data?.codes) ? data.codes : [];
    setCodes(list);
  }

  async function init() {
    setLoading(true);
    setError(null);

    try {
      await loadCountries();
    } catch (e: any) {
      setError(e?.message || "Failed to init");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCountryCode) return;

    setLoading(true);
    setError(null);

    loadPartners(selectedCountryCode)
      .catch((e: any) => setError(e?.message || "Failed to load partners"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode]);

  useEffect(() => {
    if (!selectedCountryCode || !selectedPartnerId) return;

    setLoading(true);
    setError(null);

    loadCodes(selectedCountryCode, selectedPartnerId)
      .catch((e: any) => setError(e?.message || "Failed to load codes"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartnerId, selectedCountryCode]);

  // ✅ Normalize code status for both legacy + newer backend formats
  function normalizeCodeStatus(c: InsuranceCode): "ACTIVE" | "USED" | "EXPIRED" | "REVOKED" {
    // legacy field
    if (c.status) return c.status;

    // newer backend: usage / isActive
    const usedCount = c.usage?.usedCount || 0;
    if (usedCount > 0) return "USED";

    if (c.expiresAt) {
      const exp = new Date(c.expiresAt).getTime();
      if (Number.isFinite(exp) && Date.now() > exp) return "EXPIRED";
    }

    if (c.isActive === false) return "REVOKED";
    return "ACTIVE";
  }

  const filteredCodes = useMemo(() => {
    if (codeStatusFilter === "ALL") return codes;
    return codes.filter((c) => normalizeCodeStatus(c) === codeStatusFilter);
  }, [codes, codeStatusFilter]);

  async function createPartner() {
    if (!selectedCountryCode) return;

    const name = newPartnerName.trim();
    const partnerCode = newPartnerCode.trim().toUpperCase();

    if (!name) {
      setError("Partner name is required");
      return;
    }
    if (!partnerCode) {
      setError("Partner code is required (e.g. ABC, OUTSURANCE, DISCOVERY)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/insurance/partners`, {
        method: "POST",
        headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
        body: JSON.stringify({
          // ✅ send new format (matches backend requirement)
          name,
          partnerCode,

          // ✅ also send legacy aliases (safe)
          code: partnerCode,
          countryCode: selectedCountryCode,
          countryCodes: [selectedCountryCode],

          // ✅ map dashboard fields -> backend fields
          email: newPartnerEmail.trim() || null,
          phone: newPartnerPhone.trim() || null,

          // ✅ keep legacy keys too (if any old code reads these)
          contactEmail: newPartnerEmail.trim() || null,
          contactPhone: newPartnerPhone.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Create partner failed");

      setNewPartnerName("");
      setNewPartnerCode("");
      setNewPartnerEmail("");
      setNewPartnerPhone("");

      await loadPartners(selectedCountryCode);
    } catch (e: any) {
      setError(e?.message || "Create partner failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePartnerActive(partnerId: string, nextActive: boolean) {
    if (!selectedCountryCode) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/insurance/partners/${partnerId}`,
        {
          method: "PATCH", // ✅ backend uses PATCH
          headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
          body: JSON.stringify({ isActive: nextActive }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Update partner failed");

      await loadPartners(selectedCountryCode);
    } catch (e: any) {
      setError(e?.message || "Update partner failed");
    } finally {
      setSaving(false);
    }
  }

  async function generateCodes() {
    if (!selectedCountryCode || !selectedPartnerId) return;

    const count = Number(generateCount || 0);
    if (!count || count < 1 || count > 5000) {
      setError("Enter a valid number of codes (1 - 5000)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // ✅ backend path: /admin/partners/:partnerId/codes/generate
      const res = await fetch(
        `${API_BASE}/api/admin/insurance/partners/${selectedPartnerId}/codes/generate`,
        {
          method: "POST",
          headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
          body: JSON.stringify({
            count,
            countryCode: selectedCountryCode,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Generate codes failed");

      await loadCodes(selectedCountryCode, selectedPartnerId);
    } catch (e: any) {
      setError(e?.message || "Generate codes failed");
    } finally {
      setSaving(false);
    }
  }

  async function revokeCode(codeId: string) {
    if (!selectedCountryCode) return;

    setSaving(true);
    setError(null);

    try {
      // ✅ backend path: PATCH /admin/codes/:id/disable
      const res = await fetch(
        `${API_BASE}/api/admin/insurance/codes/${codeId}/disable`,
        {
          method: "PATCH",
          headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Disable failed");

      await loadCodes(selectedCountryCode, selectedPartnerId);
    } catch (e: any) {
      setError(e?.message || "Disable failed");
    } finally {
      setSaving(false);
    }
  }

  async function loadInvoice() {
    if (!selectedCountryCode || !selectedPartnerId) return;

    setSaving(true);
    setError(null);
    setInvoice(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/insurance/invoice?countryCode=${encodeURIComponent(
          selectedCountryCode
        )}&partnerId=${encodeURIComponent(
          selectedPartnerId
        )}&month=${encodeURIComponent(invoiceMonth)}`,
        {
          method: "GET",
          headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Invoice fetch failed");

      setInvoice(data?.invoice || null);
    } catch (e: any) {
      setError(e?.message || "Invoice fetch failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
        Insurance Partners
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Manage insurance partners, generate unique codes per partner, and track monthly usage
        for invoicing (no booking fee payments for insurance jobs).
      </p>

      {error ? (
        <div
          style={{
            background: "#ffefef",
            border: "1px solid #ffbdbd",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            color: "#7a0000",
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Top filters */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "white",
          marginBottom: 18,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div style={{ minWidth: 320 }}>
          <label style={{ fontSize: 12, opacity: 0.75 }}>Country</label>
          <select
            value={selectedCountryCode}
            onChange={(e) => setSelectedCountryCode(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            {countries.map((c) => (
              <option key={c._id} value={c.code}>
                {c.code} — {c.name} {c.isActive ? "" : "(inactive)"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 360 }}>
          <label style={{ fontSize: 12, opacity: 0.75 }}>Partner</label>
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {p.partnerCode ? ` (${p.partnerCode})` : ""}
                {p.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {selectedPartner ? (
            <button
              onClick={() =>
                togglePartnerActive(selectedPartner._id, !selectedPartner.isActive)
              }
              disabled={saving}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
              }}
            >
              {selectedPartner.isActive ? "Disable partner" : "Enable partner"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
        {/* Left: Create partner + Generate codes */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Create partner */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
              Create Partner
            </h2>

            <Field label="Partner name">
              <input
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                placeholder="Example: ABC Insurance"
                style={inputStyle}
              />
            </Field>

            <Field label="Partner code (required)">
              <input
                value={newPartnerCode}
                onChange={(e) => setNewPartnerCode(e.target.value)}
                placeholder="Example: ABC / OUTSURANCE / DISCOVERY"
                style={inputStyle}
              />
            </Field>

            <Field label="Contact email (optional)">
              <input
                value={newPartnerEmail}
                onChange={(e) => setNewPartnerEmail(e.target.value)}
                placeholder="billing@abc.co.za"
                style={inputStyle}
              />
            </Field>

            <Field label="Contact phone (optional)">
              <input
                value={newPartnerPhone}
                onChange={(e) => setNewPartnerPhone(e.target.value)}
                placeholder="+27..."
                style={inputStyle}
              />
            </Field>

            <button
              onClick={createPartner}
              disabled={saving || !selectedCountryCode}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: saving ? "#9ca3af" : "#111827",
                color: "white",
                fontWeight: 900,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Create Partner"}
            </button>
          </div>

          {/* Generate codes */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
              Generate Codes
            </h2>

            <Field label="Number of codes">
              <input
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                min={1}
                max={5000}
                style={inputStyle}
              />
            </Field>

            <button
              onClick={generateCodes}
              disabled={saving || !selectedPartnerId}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #2563eb",
                background: saving ? "#93c5fd" : "#2563eb",
                color: "white",
                fontWeight: 900,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Working..." : "Generate Codes"}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Codes are unique per partner + country. A code from Partner A cannot be used when
              Partner B is selected.
            </div>
          </div>

          {/* Invoice */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              background: "white",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>
              Monthly Invoice
            </h2>

            <Field label="Month">
              <select
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(e.target.value)}
                style={inputStyle}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={loadInvoice}
              disabled={saving || !selectedPartnerId}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #10b981",
                background: saving ? "#86efac" : "#10b981",
                color: "white",
                fontWeight: 900,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Loading..." : "Generate Invoice Summary"}
            </button>

            {invoice ? (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <div>
                  <b>Total jobs:</b> {invoice.totalJobs}
                </div>
                <div>
                  <b>Total amount:</b> {invoice.totalAmount} {invoice.currency}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Codes list + invoice items */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Codes */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "white",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900 }}>Codes ({codes.length})</div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <select
                  value={codeStatusFilter}
                  onChange={(e) => setCodeStatusFilter(e.target.value as any)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="USED">Used</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 14, opacity: 0.7 }}>Loading...</div>
            ) : filteredCodes.length === 0 ? (
              <div style={{ padding: 14, opacity: 0.7 }}>
                No codes found for this selection.
              </div>
            ) : (
              <div style={{ maxHeight: 560, overflow: "auto" }}>
                {filteredCodes.map((c) => {
                  const st = normalizeCodeStatus(c);
                  const usedAt =
                    c.usedAt ||
                    c.usage?.lastUsedAt ||
                    null;

                  return (
                    <div
                      key={c._id}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: 14 }}>{c.code}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          Status: <b>{st}</b>{" "}
                          {usedAt ? `• Used: ${new Date(usedAt).toLocaleString()}` : ""}
                        </div>

                        {c.usedByJobId ? (
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            Job: {c.usedByJobId}
                          </div>
                        ) : null}

                        {c.usage?.maxUses ? (
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            Uses: {c.usage?.usedCount || 0}/{c.usage.maxUses}
                          </div>
                        ) : null}
                      </div>

                      <button
                        onClick={() => revokeCode(c._id)}
                        disabled={saving || st !== "ACTIVE"}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #ef4444",
                          background: st === "ACTIVE" ? "#ef4444" : "#fca5a5",
                          color: "white",
                          fontWeight: 900,
                          cursor:
                            saving || st !== "ACTIVE"
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Disable
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoice items */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "white",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #e5e7eb",
                fontWeight: 900,
              }}
            >
              Invoice Items {invoice ? `(${invoice.items.length})` : ""}
            </div>

            {!invoice ? (
              <div style={{ padding: 14, opacity: 0.7 }}>
                Generate invoice to see job usage.
              </div>
            ) : invoice.items.length === 0 ? (
              <div style={{ padding: 14, opacity: 0.7 }}>
                No insurance jobs for {invoice.month}.
              </div>
            ) : (
              <div style={{ maxHeight: 380, overflow: "auto" }}>
                {invoice.items.map((it) => (
                  <div
                    key={it.jobId}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 14 }}>
                      Job {it.jobId}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {new Date(it.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <b>Pickup:</b> {it.pickupAddressText || "-"}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <b>Dropoff:</b> {it.dropoffAddressText || "-"}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      <b>Amount:</b> {it.amount} {it.currency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #d1d5db",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 10,
      }}
    >
      <label style={{ fontSize: 12, opacity: 0.75 }}>{label}</label>
      {children}
    </div>
  );
}