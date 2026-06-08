// dashboard/app/dashboard/insurance/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createPartner,
  disableCode,
  generateCodes,
  getCodes,
  getPartners,
  updatePartner,
  type InsuranceCode,
  type InsurancePartner,
} from "@/lib/api/insurance";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function authHeaders(extra: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("adminToken") || localStorage.getItem("token")
      : null;

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

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function jsonToPretty(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function safeTrimOrNull(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

/**
 * ✅ Workspace country fallback
 * Insurance page must NOT require canManageCountries (countries list endpoint).
 * If /api/admin/countries is forbidden, we fall back to the currently selected workspace country
 * stored in localStorage, and proceed with insurance operations for that country.
 */
function getWorkspaceCountryCodeFallback(): string {
  if (typeof window === "undefined") return "ZA";

  const candidates = [
    "countryCode",
    "selectedCountryCode",
    "workspaceCountryCode",
    "adminCountryCode",
    "x-country-code",
    "COUNTRY_CODE",
  ];

  for (const k of candidates) {
    const v = localStorage.getItem(k);
    if (v && String(v).trim()) return String(v).trim().toUpperCase();
  }

  // Some apps store a JSON “user” object
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const cc =
        u?.countryCode ||
        u?.country ||
        u?.workspaceCountryCode ||
        u?.profile?.countryCode ||
        null;
      if (cc) return String(cc).trim().toUpperCase();
    }
  } catch {
    // ignore
  }

  return "ZA";
}

function currencyByCountry(code: string): string {
  const cc = String(code || "").toUpperCase();
  const map: Record<string, string> = {
    ZA: "ZAR",
    TZ: "TSH",
    KE: "KES",
    NG: "NGN",
    GH: "GHS",
    UG: "UGX",
    RW: "RWF",
    ZM: "ZMW",
    BW: "BWP",
    NA: "NAD",
    MZ: "MZN",
    AO: "AOA",
  };
  return map[cc] || "—";
}

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

  const currency = useMemo(() => {
    const c = countries.find((x) => x.code === selectedCountryCode);
    // If countries list is fallback stub, still provide a currency guess.
    return c?.currency || currencyByCountry(selectedCountryCode) || "—";
  }, [countries, selectedCountryCode]);

  const [codes, setCodes] = useState<InsuranceCode[]>([]);

  // Create partner modal
  const [openCreate, setOpenCreate] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerCode, setNewPartnerCode] = useState("");
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerPhone, setNewPartnerPhone] = useState("");

  // Edit partner modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editPartner, setEditPartner] = useState<InsurancePartner | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsArchived, setEditIsArchived] = useState(false);

  // Generate codes
  const [generateCount, setGenerateCount] = useState<number>(50);

  // Batch revoke codes
  const [openBatchRevoke, setOpenBatchRevoke] = useState(false);
  const [batchMode, setBatchMode] = useState<"ALL_UNUSED" | "SELECTED">(
    "ALL_UNUSED"
  );
  const [batchSelected, setBatchSelected] = useState<Record<string, boolean>>(
    {}
  );
  const [batchReason, setBatchReason] = useState("");

  // Helpers: partner list + codes
  async function loadCountries() {
    // ✅ Attempt to load full countries list (SuperAdmin / admins with canManageCountries)
    // ✅ If forbidden, fallback to workspace country from localStorage and continue.
    try {
      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = String(data?.message || "").toLowerCase();
        const looksLikeCountriesPermission =
          res.status === 403 ||
          msg.includes("canmanagecountries") ||
          msg.includes("missing canmanagecountries") ||
          msg.includes("permission denied");

        if (looksLikeCountriesPermission) {
          const cc = getWorkspaceCountryCodeFallback();
          const stub: Country = {
            _id: "workspace-country",
            code: cc,
            name: cc,
            currency: currencyByCountry(cc),
            isActive: true,
          };
          setCountries([stub]);
          if (!selectedCountryCode) setSelectedCountryCode(cc);
          return;
        }

        throw new Error(data?.message || "Failed to load countries");
      }

      const list: Country[] = Array.isArray(data?.countries)
        ? data.countries
        : [];
      setCountries(list);

      if (!selectedCountryCode && list.length > 0) {
        setSelectedCountryCode(list[0].code);
      }

      // If list is empty (edge), also fallback to workspace country
      if (list.length === 0) {
        const cc = getWorkspaceCountryCodeFallback();
        const stub: Country = {
          _id: "workspace-country",
          code: cc,
          name: cc,
          currency: currencyByCountry(cc),
          isActive: true,
        };
        setCountries([stub]);
        if (!selectedCountryCode) setSelectedCountryCode(cc);
      }
    } catch (e: any) {
      // Network errors: also fallback, don’t block insurance usage.
      const cc = getWorkspaceCountryCodeFallback();
      const stub: Country = {
        _id: "workspace-country",
        code: cc,
        name: cc,
        currency: currencyByCountry(cc),
        isActive: true,
      };
      setCountries([stub]);
      if (!selectedCountryCode) setSelectedCountryCode(cc);
    }
  }

  async function reloadPartners(countryCode: string, keepSelected = true) {
    const list = await getPartners(countryCode);
    setPartners(list);

    if (!keepSelected) {
      setSelectedPartnerId(list[0]?._id || "");
      return;
    }

    if (!selectedPartnerId && list.length > 0) setSelectedPartnerId(list[0]._id);
    if (selectedPartnerId && !list.some((p) => p._id === selectedPartnerId)) {
      setSelectedPartnerId(list[0]?._id || "");
    }
  }

  async function reloadCodes(countryCode: string, partnerId: string) {
    const list = await getCodes(countryCode, partnerId);
    setCodes(Array.isArray(list) ? list : []);
    setBatchSelected({}); // reset selections when codes reload
  }

  async function init() {
    setLoading(true);
    setError(null);
    try {
      await loadCountries();
    } catch (e: any) {
      // With the new fallback logic, we should almost never hit this.
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

    reloadPartners(selectedCountryCode, true)
      .catch((e: any) => setError(e?.message || "Failed to load partners"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode]);

  useEffect(() => {
    if (!selectedCountryCode || !selectedPartnerId) return;
    setLoading(true);
    setError(null);

    reloadCodes(selectedCountryCode, selectedPartnerId)
      .catch((e: any) => setError(e?.message || "Failed to load codes"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartnerId, selectedCountryCode]);

  // ---- Code status + grouping (ACTIVE / USED / REVOKED) ----
  function normalizeCodeStatus(c: InsuranceCode): "ACTIVE" | "USED" | "REVOKED" {
    const usedCount = (c as any).usage?.usedCount || 0;
    const isActive = (c as any).isActive;
    if (isActive === false) return "REVOKED";
    if (usedCount > 0) return "USED";
    return "ACTIVE";
  }

  function codeUsedAmount(c: InsuranceCode): number | null {
    const u = (c as any).usage || {};
    const direct =
      u.lastJobAmount ??
      u.lastUsedJobAmount ??
      u.lastJobTotal ??
      u.jobAmount ??
      u.amount ??
      null;

    if (typeof direct === "number") return direct;

    const job = u.lastJob || u.job || null;
    if (job) {
      const v = job.amount ?? job.total ?? job.estimatedTotal ?? null;
      if (typeof v === "number") return v;
    }

    return null;
  }

  const groupedCodes = useMemo(() => {
    const active: InsuranceCode[] = [];
    const used: InsuranceCode[] = [];
    const revoked: InsuranceCode[] = [];

    for (const c of codes) {
      const st = normalizeCodeStatus(c);
      if (st === "USED") used.push(c);
      else if (st === "REVOKED") revoked.push(c);
      else active.push(c);
    }

    return { active, used, revoked };
  }, [codes]);

  // ---- Actions ----
  async function onCreatePartner() {
    if (!selectedCountryCode) return;

    const name = newPartnerName.trim();
    const partnerCode = newPartnerCode.trim().toUpperCase();
    if (!name) return setError("Partner name is required");
    if (!partnerCode) return setError("Partner code is required");

    setSaving(true);
    setError(null);

    try {
      // ✅ send both naming variants so backend definitely persists
      const email = safeTrimOrNull(newPartnerEmail);
      const phone = safeTrimOrNull(newPartnerPhone);

      await createPartner(
        selectedCountryCode,
        {
          name,
          partnerCode,
          email,
          phone,
          contactEmail: email,
          contactPhone: phone,
          countryCodes: [selectedCountryCode],
        } as any
      );

      setNewPartnerName("");
      setNewPartnerCode("");
      setNewPartnerEmail("");
      setNewPartnerPhone("");
      setOpenCreate(false);

      await reloadPartners(selectedCountryCode, false);
    } catch (e: any) {
      setError(e?.message || "Create partner failed");
    } finally {
      setSaving(false);
    }
  }

  function openEditPartner(p: InsurancePartner) {
    setEditPartner(p);
    setEditName(p.name || "");
    setEditCode((p as any).partnerCode || "");
    setEditEmail((p as any).email || (p as any).contactEmail || "");
    setEditPhone((p as any).phone || (p as any).contactPhone || "");
    setEditIsActive(Boolean((p as any).isActive));
    setEditIsArchived(Boolean((p as any).isArchived));
    setOpenEdit(true);
  }

  async function onSavePartnerEdits() {
    if (!selectedCountryCode || !editPartner) return;

    const name = editName.trim();
    const partnerCode = editCode.trim().toUpperCase();
    if (!name) return setError("Partner name is required");
    if (!partnerCode) return setError("Partner code is required");

    setSaving(true);
    setError(null);

    try {
      // ✅ update both naming variants too
      const email = safeTrimOrNull(editEmail);
      const phone = safeTrimOrNull(editPhone);

      await updatePartner(
        selectedCountryCode,
        editPartner._id,
        {
          name,
          partnerCode,
          email,
          phone,
          contactEmail: email,
          contactPhone: phone,
          isActive: editIsActive,
          isArchived: editIsArchived,
        } as any
      );

      setOpenEdit(false);
      setEditPartner(null);

      await reloadPartners(selectedCountryCode, true);
    } catch (e: any) {
      setError(e?.message || "Update partner failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePartnerActive(partnerId: string, nextActive: boolean) {
    if (!selectedCountryCode) return;
    setSaving(true);
    setError(null);
    try {
      await updatePartner(selectedCountryCode, partnerId, {
        isActive: nextActive,
      } as any);
      await reloadPartners(selectedCountryCode, true);
    } catch (e: any) {
      setError(e?.message || "Update partner failed");
    } finally {
      setSaving(false);
    }
  }

  async function togglePartnerArchived(
    partnerId: string,
    nextArchived: boolean
  ) {
    if (!selectedCountryCode) return;
    setSaving(true);
    setError(null);
    try {
      await updatePartner(selectedCountryCode, partnerId, {
        isArchived: nextArchived,
      } as any);
      await reloadPartners(selectedCountryCode, true);
    } catch (e: any) {
      setError(e?.message || "Archive update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerateCodes() {
    if (!selectedCountryCode || !selectedPartnerId) return;

    const count = Number(generateCount || 0);
    if (!count || count < 1 || count > 5000)
      return setError("Enter a valid number (1 - 5000)");

    setSaving(true);
    setError(null);

    try {
      await generateCodes(selectedCountryCode, {
        partnerId: selectedPartnerId,
        countryCode: selectedCountryCode,
        count,
      });

      await reloadCodes(selectedCountryCode, selectedPartnerId);
    } catch (e: any) {
      setError(e?.message || "Generate codes failed");
    } finally {
      setSaving(false);
    }
  }

  async function onRevokeCode(codeId: string) {
    if (!selectedCountryCode) return;
    setSaving(true);
    setError(null);
    try {
      await disableCode(selectedCountryCode, codeId);
      await reloadCodes(selectedCountryCode, selectedPartnerId);
    } catch (e: any) {
      setError(e?.message || "Revoke failed");
    } finally {
      setSaving(false);
    }
  }

  // Batch revoke
  async function onBatchRevokeConfirm() {
    if (!selectedCountryCode || !selectedPartnerId) return;

    const reason = safeTrimOrNull(batchReason) || "Batch revoked by admin";

    let targets: InsuranceCode[] = [];
    if (batchMode === "ALL_UNUSED") {
      targets = groupedCodes.active; // ACTIVE = unused
    } else {
      const ids = Object.keys(batchSelected).filter((k) => batchSelected[k]);
      targets = codes.filter((c) => ids.includes((c as any)._id));
    }

    if (targets.length === 0) {
      setError("No codes selected for batch revoke.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Best effort: run sequentially to avoid rate-limits / backend constraints
      // If disableCode supports a reason payload in your api layer, wire it there.
      // (Keeping reason here for future endpoint enhancement)
      void reason;

      for (const c of targets) {
        await disableCode(selectedCountryCode, (c as any)._id);
      }

      setOpenBatchRevoke(false);
      setBatchSelected({});
      setBatchReason("");
      await reloadCodes(selectedCountryCode, selectedPartnerId);
    } catch (e: any) {
      setError(e?.message || "Batch revoke failed");
    } finally {
      setSaving(false);
    }
  }

  const partnerStatusLabel = (p: InsurancePartner) => {
    const isActive = Boolean((p as any).isActive);
    const isArchived = Boolean((p as any).isArchived);
    if (isArchived) return <span style={{ ...pill("ARCHIVED").style }}>ARCHIVED</span>;
    if (isActive) return <span style={{ ...pill("ACTIVE").style }}>ACTIVE</span>;
    return <span style={{ ...pill("DISABLED").style }}>DISABLED</span>;
  };

  // Selection helpers
  const toggleSelected = (id: string) => {
    setBatchSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearSelections = () => setBatchSelected({});

  const selectedCount = useMemo(() => {
    return Object.values(batchSelected).filter(Boolean).length;
  }, [batchSelected]);

  return (
    <div style={{ padding: 20, maxWidth: 1500 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
        Insurance Partners
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Partners, codes, and insurance-job invoices. Generate invoices by Month or by Date Range, filter by Provider,
        and export PDFs (General + Individual statements).
      </p>

      {error ? (
        <div
          style={{
            background: "#ffefef",
            border: "1px solid #ffbdbd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            color: "#7a0000",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Header controls */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 14,
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
            style={inputStyle}
          >
            {countries.map((c) => (
              <option key={c._id} value={c.code}>
                {c.code} — {c.name} {c.isActive ? "" : "(inactive)"}
              </option>
            ))}
          </select>
          {countries.length === 1 && countries[0]?._id === "workspace-country" ? (
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Using your current <b>Country workspace</b> (no Countries permission required).
            </div>
          ) : null}
        </div>

        <div style={{ minWidth: 460 }}>
          <label style={{ fontSize: 12, opacity: 0.75 }}>Partner</label>
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            style={inputStyle}
          >
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {(p as any).partnerCode ? ` (${(p as any).partnerCode})` : ""}
                {Boolean((p as any).isArchived)
                  ? " (archived)"
                  : Boolean((p as any).isActive)
                  ? ""
                  : " (disabled)"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setOpenCreate(true)} disabled={saving || !selectedCountryCode} style={primaryBtnInline}>
            + Create Insurance Partner
          </button>

          {selectedPartner ? (
            <>
              <button onClick={() => openEditPartner(selectedPartner)} disabled={saving} style={secondaryBtnInline}>
                Edit Partner
              </button>

              <button
                onClick={() =>
                  togglePartnerActive(
                    selectedPartner._id,
                    !Boolean((selectedPartner as any).isActive)
                  )
                }
                disabled={saving}
                style={
                  Boolean((selectedPartner as any).isActive)
                    ? dangerBtnInline
                    : successBtnInline
                }
              >
                {Boolean((selectedPartner as any).isActive) ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() =>
                  togglePartnerArchived(
                    selectedPartner._id,
                    !Boolean((selectedPartner as any).isArchived)
                  )
                }
                disabled={saving}
                style={warningBtnInline}
              >
                {Boolean((selectedPartner as any).isArchived) ? "Unarchive" : "Archive"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Management column */}
        <div style={{ display: "grid", gap: 16 }}>
          <Box title="Partner Management">
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Use <b>Edit Partner</b> to update name/code/contact and to set <b>Enabled/Disabled</b> or <b>Archived</b>.
            </div>
            <div style={{ marginTop: 12 }}>
              {selectedPartner ? (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>{selectedPartner.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Code: <b>{(selectedPartner as any).partnerCode || "—"}</b> • Status: {partnerStatusLabel(selectedPartner)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                    Email: {(selectedPartner as any).email || (selectedPartner as any).contactEmail || "—"} • Phone:{" "}
                    {(selectedPartner as any).phone || (selectedPartner as any).contactPhone || "—"}
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.75 }}>Select a partner to manage.</div>
              )}
            </div>
          </Box>

          <Box title="Generate Codes">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Selected partner: <b>{selectedPartner?.name || "—"}</b>{" "}
                {selectedPartner ? (
                  <>
                    • {partnerStatusLabel(selectedPartner)} • Currency: <b>{currency}</b>
                  </>
                ) : null}
              </div>
            </div>

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

            <button onClick={onGenerateCodes} disabled={saving || !selectedPartnerId} style={blueBtn}>
              {saving ? "Working..." : "Generate Codes"}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Codes are unique per partner + country. Revoke disables a code immediately.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={onDownloadCodesPdf} disabled={saving || !selectedPartnerId} style={purpleBtnInline}>
                Download Codes PDF
              </button>

              <button onClick={() => setOpenBatchRevoke(true)} disabled={saving || !selectedPartnerId} style={dangerBtnInline}>
                Batch Revoke Codes
              </button>
            </div>
          </Box>

          <div style={{ display: "grid", gap: 12 }}>
            <CodeRow
              title={`ACTIVE Codes (${groupedCodes.active.length})`}
              subtitle="Unused / available codes"
              rowColor="GREEN"
              items={groupedCodes.active}
              currency={currency}
              saving={saving}
              onRevoke={onRevokeCode}
              selectable
              selectedMap={batchSelected}
              onToggleSelected={toggleSelected}
            />

            <CodeRow
              title={`USED Codes (${groupedCodes.used.length})`}
              subtitle="Used codes (shows job amount if available)"
              rowColor="YELLOW"
              items={groupedCodes.used}
              currency={currency}
              saving={saving}
              onRevoke={onRevokeCode}
              showAmount
              getAmount={codeUsedAmount}
              selectable
              selectedMap={batchSelected}
              onToggleSelected={toggleSelected}
            />

            <CodeRow
              title={`REVOKED Codes (${groupedCodes.revoked.length})`}
              subtitle="Disabled codes"
              rowColor="RED"
              items={groupedCodes.revoked}
              currency={currency}
              saving={saving}
              onRevoke={onRevokeCode}
              showAmount
              getAmount={codeUsedAmount}
              revoked
              selectable
              selectedMap={batchSelected}
              onToggleSelected={toggleSelected}
            />
          </div>
        </div>
      </div>

      {/* Create Partner Modal */}
      {openCreate ? (
        <Modal title="Create Insurance Partner" onClose={() => (!saving ? setOpenCreate(false) : null)}>
          <div style={{ display: "grid", gap: 10 }}>
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

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button onClick={() => setOpenCreate(false)} disabled={saving} style={secondaryBtnInline}>
                Cancel
              </button>
              <button onClick={onCreatePartner} disabled={saving || !selectedCountryCode} style={primaryBtnInline}>
                {saving ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Edit Partner Modal */}
      {openEdit && editPartner ? (
        <Modal title="Edit Partner" onClose={() => (!saving ? setOpenEdit(false) : null)}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
              <div style={{ fontWeight: 900 }}>{editPartner.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Partner ID: <span style={{ fontFamily: "monospace" }}>{editPartner._id}</span>
              </div>
            </div>

            <Field label="Partner name">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Partner code">
              <input value={editCode} onChange={(e) => setEditCode(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Email">
              <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Phone">
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={inputStyle} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Enabled</div>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                  <span style={{ fontWeight: 800 }}>{editIsActive ? "Enabled" : "Disabled"}</span>
                </label>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Archived</div>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={editIsArchived} onChange={(e) => setEditIsArchived(e.target.checked)} />
                  <span style={{ fontWeight: 800 }}>{editIsArchived ? "Archived" : "Not archived"}</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button onClick={() => setOpenEdit(false)} disabled={saving} style={secondaryBtnInline}>
                Cancel
              </button>
              <button onClick={onSavePartnerEdits} disabled={saving} style={greenBtnInline}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", fontWeight: 900 }}>Raw partner object</summary>
              <pre style={{ fontSize: 12, background: "#0b1220", color: "#e5e7eb", padding: 12, borderRadius: 12 }}>
                {jsonToPretty(editPartner)}
              </pre>
            </details>
          </div>
        </Modal>
      ) : null}

      {/* Batch Revoke Modal */}
      {openBatchRevoke ? (
        <Modal title="Batch Revoke Codes" onClose={() => (!saving ? setOpenBatchRevoke(false) : null)}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Partner: <b>{selectedPartner?.name || "—"}</b> • Country: <b>{selectedCountryCode || "—"}</b>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Choose batch revoke mode</div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                  type="radio"
                  name="batchMode"
                  checked={batchMode === "ALL_UNUSED"}
                  onChange={() => setBatchMode("ALL_UNUSED")}
                />
                <span>
                  Revoke <b>ALL ACTIVE</b> codes (unused)
                  <span style={{ opacity: 0.75 }}> • ({groupedCodes.active.length} codes)</span>
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="radio"
                  name="batchMode"
                  checked={batchMode === "SELECTED"}
                  onChange={() => setBatchMode("SELECTED")}
                />
                <span>
                  Revoke <b>SELECTED</b> codes from lists
                  <span style={{ opacity: 0.75 }}> • (selected: {selectedCount})</span>
                </span>
              </label>

              {batchMode === "SELECTED" ? (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  Tip: tick codes in the code rows, then come back here to revoke the selected batch.
                </div>
              ) : null}
            </div>

            <Field label="Reason (optional)">
              <input
                value={batchReason}
                onChange={(e) => setBatchReason(e.target.value)}
                placeholder="Reason shown in audit logs (optional)"
                style={inputStyle}
              />
            </Field>

            {batchMode === "SELECTED" ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button onClick={clearSelections} disabled={saving} style={secondaryBtnInline}>
                  Clear selected
                </button>
                <div style={{ fontSize: 12, opacity: 0.8, alignSelf: "center" }}>
                  Selected: <b>{selectedCount}</b>
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button onClick={() => setOpenBatchRevoke(false)} disabled={saving} style={secondaryBtnInline}>
                Cancel
              </button>
              <button onClick={onBatchRevokeConfirm} disabled={saving} style={dangerBtnInline}>
                {saving ? "Revoking..." : "Confirm Batch Revoke"}
              </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
              Note: batch revoke disables codes one-by-one. If you want a single backend operation, we can add a dedicated
              endpoint and call it here.
            </div>
          </div>
        </Modal>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 16, opacity: 0.7, fontSize: 13 }}>
          Loading...
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- UI components ---------------- */

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "white" }}>
      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      <label style={{ fontSize: 12, opacity: 0.75 }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(1100px, 98vw)",
          maxHeight: "88vh",
          overflow: "auto",
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 50px rgba(0,0,0,0.30)",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={secondaryBtnInline}>
            Close
          </button>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function CodeRow({
  title,
  subtitle,
  rowColor,
  items,
  currency,
  saving,
  onRevoke,
  showAmount,
  getAmount,
  revoked,
  selectable,
  selectedMap,
  onToggleSelected,
}: {
  title: string;
  subtitle: string;
  rowColor: "GREEN" | "YELLOW" | "RED";
  items: InsuranceCode[];
  currency: string;
  saving: boolean;
  onRevoke: (id: string) => void;
  showAmount?: boolean;
  getAmount?: (c: InsuranceCode) => number | null;
  revoked?: boolean;
  selectable?: boolean;
  selectedMap?: Record<string, boolean>;
  onToggleSelected?: (id: string) => void;
}) {
  const bg =
    rowColor === "GREEN"
      ? { header: "#dcfce7", border: "#86efac" }
      : rowColor === "YELLOW"
      ? { header: "#fef9c3", border: "#fde047" }
      : { header: "#fee2e2", border: "#fca5a5" };

  return (
    <div style={{ border: `1px solid ${bg.border}`, borderRadius: 14, background: "white", overflow: "hidden" }}>
      <div style={{ padding: 12, background: bg.header, borderBottom: `1px solid ${bg.border}` }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitle}</div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 12, opacity: 0.75 }}>No items.</div>
      ) : (
        <div style={{ maxHeight: 320, overflow: "auto" }}>
          {items.map((c) => {
            const id = (c as any)._id;
            const code = (c as any).code;
            const usedCount = (c as any).usage?.usedCount || 0;
            const usedAt = (c as any).usage?.lastUsedAt || null;
            const amount = showAmount && getAmount ? getAmount(c) : null;
            const checked = Boolean(selectedMap?.[id]);

            return (
              <div
                key={id}
                style={{
                  padding: 12,
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                {selectable ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelected?.(id)}
                    style={{ width: 18, height: 18 }}
                    title="Select for batch revoke"
                  />
                ) : null}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, fontFamily: "monospace" }}>{code}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Uses: <b>{usedCount}</b>
                    {usedAt ? ` • Last used: ${new Date(usedAt).toLocaleString()}` : ""}
                    {amount != null ? ` • Job amount: ${amount} ${currency}` : ""}
                  </div>
                </div>

                {!revoked ? (
                  <button onClick={() => onRevoke(id)} disabled={saving} style={dangerBtnInline} title="Revoke/disable this code">
                    Revoke
                  </button>
                ) : (
                  <span style={{ ...pill("REVOKED").style }}>REVOKED</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Print/PDF helpers ---------------- */

function buildCodesPrintHtml(
  partnerName: string,
  partnerCode: string,
  countryCode: string,
  currency: string,
  grouped: { active: InsuranceCode[]; used: InsuranceCode[]; revoked: InsuranceCode[] },
  normalizeCodeStatus: (c: InsuranceCode) => "ACTIVE" | "USED" | "REVOKED",
  getAmount: (c: InsuranceCode) => number | null
) {
  const renderList = (label: string, arr: InsuranceCode[]) => {
    const rows = arr
      .map((c) => {
        const code = (c as any).code;
        const usedCount = (c as any).usage?.usedCount || 0;
        const usedAt = (c as any).usage?.lastUsedAt || "";
        const st = normalizeCodeStatus(c);
        const amount = getAmount(c);
        return `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace;">${escapeHtml(code)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(st)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${usedCount}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${usedAt ? escapeHtml(new Date(usedAt).toLocaleString()) : ""}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${amount != null ? `${escapeHtml(String(amount))} ${escapeHtml(currency)}` : ""}</td>
        </tr>`;
      })
      .join("");

    return `
      <h2 style="margin:20px 0 8px;">${escapeHtml(label)} (${arr.length})</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Code</th>
            <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Status</th>
            <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Uses</th>
            <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Last Used</th>
            <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">Job Amount</th>
          </tr>
        </thead>
        <tbody>${rows || ""}</tbody>
      </table>
    `;
  };

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Insurance Codes</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Arial, sans-serif; color:#0f172a; }
    .meta { margin-bottom: 12px; }
    .muted { color:#475569; font-size:12px; }
  </style>
</head>
<body>
  <h1 style="margin:0 0 6px;">Insurance Codes</h1>
  <div class="meta muted">
    Partner: <b>${escapeHtml(partnerName)}</b> ${partnerCode ? `(${escapeHtml(partnerCode)})` : ""}<br/>
    Country: <b>${escapeHtml(countryCode)}</b> • Currency: <b>${escapeHtml(currency)}</b><br/>
    Generated: ${escapeHtml(new Date().toLocaleString())}
  </div>
  ${renderList("ACTIVE Codes", grouped.active)}
  ${renderList("USED Codes", grouped.used)}
  ${renderList("REVOKED Codes", grouped.revoked)}
</body>
</html>`;
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------- Styles ---------------- */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #d1d5db",
};

const primaryBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(0,0,0,0.10)",
};

const secondaryBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
};

const blueBtn: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(37,99,235,0.20)",
};

const greenBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #10b981",
  background: "#10b981",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(16,185,129,0.20)",
};

const greenBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #10b981",
  background: "#10b981",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(16,185,129,0.20)",
};

const successBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #16a34a",
  background: "#16a34a",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(22,163,74,0.20)",
};

const warningBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #f59e0b",
  background: "#f59e0b",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(245,158,11,0.20)",
};

const dangerBtnInline: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "#ef4444",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(239,68,68,0.18)",
};

const purpleBtnInline: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #7c3aed",
  background: "#7c3aed",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(124,58,237,0.18)",
};

const btnRed: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "#ef4444",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(239,68,68,0.18)",
};

const btnBlue: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(37,99,235,0.20)",
};

const btnPurple: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #7c3aed",
  background: "#7c3aed",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(124,58,237,0.18)",
};

function pill(kind: "ACTIVE" | "DISABLED" | "ARCHIVED" | "REVOKED") {
  const map: Record<string, React.CSSProperties> = {
    ACTIVE: { background: "#16a34a", color: "white" },
    DISABLED: { background: "#ef4444", color: "white" },
    ARCHIVED: { background: "#0f172a", color: "white" },
    REVOKED: { background: "#ef4444", color: "white" },
  };

  return {
    style: {
      ...map[kind],
      padding: "6px 10px",
      borderRadius: 999,
      fontWeight: 900,
      fontSize: 12,
      display: "inline-block",
    },
  };
}