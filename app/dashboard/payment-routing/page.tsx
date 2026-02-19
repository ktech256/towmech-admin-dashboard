"use client";

import React, { useEffect, useMemo, useState } from "react";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
};

type PaymentFlowType = "SDK" | "REDIRECT";

type GatewayEnum =
  | "PAYSTACK"
  | "MPESA"
  | "FLUTTERWAVE"
  | "PAYFAST"
  | "IKHOKHA"
  | "STRIPE"
  | "PAYPAL"
  | "GOOGLE_PAY"
  | "APPLE_PAY"
  | "ADYEN";

type ProviderArrayItem = {
  gateway: GatewayEnum;
  flowType: PaymentFlowType;
  enabled: boolean;
  priority?: number;

  // ✅ Phase 2 buckets (public only)
  sdkConfig?: Record<string, any>;
  redirectConfig?: Record<string, any>;

  // ✅ legacy/back-compat (safe bucket)
  config?: Record<string, any>;
};

type PaymentRoutingConfigApi = {
  countryCode: string;
  defaultProvider: string;
  providers: any;
  updatedAt?: string;
  createdAt?: string;
};

type UiProvider = {
  gateway: GatewayEnum;
  label: string;
  supportsSdk: boolean;
  supportsRedirect: boolean;
  section: "SDK" | "REDIRECT" | "BOTH";
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function authHeaders(extra: Record<string, string> = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

const PROVIDERS: UiProvider[] = [
  // Redirect providers (commonly webview/external)
  { gateway: "PAYFAST", label: "PayFast (ZA)", supportsSdk: false, supportsRedirect: true, section: "REDIRECT" },
  { gateway: "IKHOKHA", label: "iKhokha (ZA)", supportsSdk: false, supportsRedirect: true, section: "REDIRECT" },
  { gateway: "FLUTTERWAVE", label: "Flutterwave", supportsSdk: false, supportsRedirect: true, section: "REDIRECT" },

  // Dual mode
  { gateway: "PAYSTACK", label: "Paystack", supportsSdk: true, supportsRedirect: true, section: "BOTH" },
  { gateway: "MPESA", label: "M-Pesa (Kenya)", supportsSdk: true, supportsRedirect: true, section: "BOTH" },
  { gateway: "STRIPE", label: "Stripe (PaymentSheet/Checkout)", supportsSdk: true, supportsRedirect: true, section: "BOTH" },
  { gateway: "PAYPAL", label: "PayPal (Orders create/capture)", supportsSdk: true, supportsRedirect: true, section: "BOTH" },
  { gateway: "ADYEN", label: "Adyen (Drop-in/Sessions)", supportsSdk: true, supportsRedirect: true, section: "BOTH" },

  // SDK-only
  { gateway: "GOOGLE_PAY", label: "Google Pay", supportsSdk: true, supportsRedirect: false, section: "SDK" },
  { gateway: "APPLE_PAY", label: "Apple Pay", supportsSdk: true, supportsRedirect: false, section: "SDK" },
];

function normalizeGatewayEnum(input: any): GatewayEnum {
  const raw = String(input || "").trim().toUpperCase();
  const known = new Set(PROVIDERS.map((p) => p.gateway));

  if (raw === "I_KHOKHA" || raw === "I-KHOKHA") return "IKHOKHA";
  if (raw === "M_PESA" || raw === "M-PESA") return "MPESA";

  if (known.has(raw as GatewayEnum)) return raw as GatewayEnum;

  // safe fallback
  return "PAYSTACK";
}

function normalizeFlowType(input: any): PaymentFlowType {
  const raw = String(input || "").trim().toUpperCase();
  return raw === "SDK" ? "SDK" : "REDIRECT";
}

function normalizeObj(v: any): Record<string, any> {
  return v && typeof v === "object" ? v : {};
}

function normalizePriority(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildDefaultProvidersArray(): ProviderArrayItem[] {
  return PROVIDERS.map((p) => ({
    gateway: p.gateway,
    flowType: p.supportsRedirect ? "REDIRECT" : "SDK",
    enabled: false,
    priority: 0,
    sdkConfig: {},
    redirectConfig: {},
    config: {},
  }));
}

/**
 * Convert backend config to providers[] model (supports legacy shapes too).
 */
function normalizeConfigFromApi(countryCode: string, apiCfg: PaymentRoutingConfigApi | null) {
  const baseline = buildDefaultProvidersArray();

  if (!apiCfg) {
    return {
      countryCode,
      defaultProvider: "PAYSTACK" as GatewayEnum,
      providers: baseline,
    };
  }

  const defaultProvider = normalizeGatewayEnum(apiCfg.defaultProvider || "PAYSTACK");
  const providersAny = apiCfg.providers;

  // ✅ NEW: array
  if (Array.isArray(providersAny)) {
    const fromApi: ProviderArrayItem[] = providersAny
      .filter(Boolean)
      .map((p: any) => ({
        gateway: normalizeGatewayEnum(p.gateway),
        flowType: normalizeFlowType(p.flowType),
        enabled: !!p.enabled,
        priority: normalizePriority(p.priority),
        sdkConfig: normalizeObj(p.sdkConfig),
        redirectConfig: normalizeObj(p.redirectConfig),
        config: normalizeObj(p.config),
      }));

    const merged = baseline.map((b) => {
      const hit = fromApi.find((x) => x.gateway === b.gateway);
      return hit ? { ...b, ...hit } : b;
    });

    return {
      countryCode,
      defaultProvider,
      providers: merged,
      updatedAt: apiCfg.updatedAt,
      createdAt: apiCfg.createdAt,
    };
  }

  // ✅ LEGACY: object keyed
  if (providersAny && typeof providersAny === "object") {
    const fromLegacy: ProviderArrayItem[] = Object.entries(providersAny as Record<string, any>).map(
      ([k, v]) => ({
        gateway: normalizeGatewayEnum(k),
        flowType: "REDIRECT",
        enabled: !!(v as any)?.enabled,
        priority: normalizePriority((v as any)?.priority),
        sdkConfig: normalizeObj((v as any)?.sdkConfig),
        redirectConfig: normalizeObj((v as any)?.redirectConfig),
        config: normalizeObj((v as any)?.config),
      })
    );

    const merged = baseline.map((b) => {
      const hit = fromLegacy.find((x) => x.gateway === b.gateway);
      return hit ? { ...b, ...hit } : b;
    });

    return {
      countryCode,
      defaultProvider,
      providers: merged,
      updatedAt: apiCfg.updatedAt,
      createdAt: apiCfg.createdAt,
    };
  }

  return {
    countryCode,
    defaultProvider,
    providers: baseline,
    updatedAt: apiCfg.updatedAt,
    createdAt: apiCfg.createdAt,
  };
}

function buildPayloadForSave(countryCode: string, defaultProvider: GatewayEnum, providers: ProviderArrayItem[]) {
  return {
    countryCode,
    defaultProvider,
    providers: providers.map((p) => ({
      gateway: p.gateway,
      flowType: p.flowType,
      enabled: !!p.enabled,
      priority: normalizePriority(p.priority),
      sdkConfig: normalizeObj(p.sdkConfig),
      redirectConfig: normalizeObj(p.redirectConfig),
      config: normalizeObj(p.config), // keep legacy bucket too (safe)
    })),
  };
}

export default function PaymentRoutingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");

  const [defaultProvider, setDefaultProvider] = useState<GatewayEnum>("PAYSTACK");
  const [providers, setProviders] = useState<ProviderArrayItem[]>(buildDefaultProvidersArray());

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.code === selectedCountryCode) || null;
  }, [countries, selectedCountryCode]);

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

  async function loadRouting(countryCode: string) {
    const res = await fetch(`${API_BASE}/api/admin/payment-routing/${countryCode}`, {
      method: "GET",
      headers: authHeaders({ "X-COUNTRY-CODE": countryCode }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load payment routing config");

    const apiCfg: PaymentRoutingConfigApi | null = data?.config || null;
    const normalized = normalizeConfigFromApi(countryCode, apiCfg);

    setDefaultProvider(normalized.defaultProvider);
    setProviders(normalized.providers);
  }

  async function init() {
    setLoading(true);
    setError(null);
    try {
      await loadCountries();
    } catch (e: any) {
      setError(e?.message || "Failed to load countries");
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

    loadRouting(selectedCountryCode)
      .catch((e: any) => setError(e?.message || "Failed to load routing"))
      .finally(() => setLoading(false));
  }, [selectedCountryCode]);

  function updateProvider(gateway: GatewayEnum, patch: Partial<ProviderArrayItem>) {
    setProviders((prev) => prev.map((p) => (p.gateway === gateway ? { ...p, ...patch } : p)));
  }

  function updateProviderSdkConfig(gateway: GatewayEnum, patch: Record<string, any>) {
    setProviders((prev) =>
      prev.map((p) => (p.gateway === gateway ? { ...p, sdkConfig: { ...(p.sdkConfig || {}), ...patch } } : p))
    );
  }

  function updateProviderRedirectConfig(gateway: GatewayEnum, patch: Record<string, any>) {
    setProviders((prev) =>
      prev.map((p) =>
        p.gateway === gateway ? { ...p, redirectConfig: { ...(p.redirectConfig || {}), ...patch } } : p
      )
    );
  }

  async function save() {
    if (!selectedCountryCode) return;

    setSaving(true);
    setError(null);

    try {
      const catalog = new Map(PROVIDERS.map((p) => [p.gateway, p]));

      const def = providers.find((p) => p.gateway === defaultProvider);
      if (!def || !def.enabled) {
        throw new Error(`Default provider (${defaultProvider}) must be enabled`);
      }

      for (const p of providers) {
        const meta = catalog.get(p.gateway);
        if (!meta) continue;

        if (p.flowType === "SDK" && !meta.supportsSdk) throw new Error(`${p.gateway} cannot be set to SDK flow.`);
        if (p.flowType === "REDIRECT" && !meta.supportsRedirect) throw new Error(`${p.gateway} cannot be set to REDIRECT flow.`);
      }

      const payload = buildPayloadForSave(selectedCountryCode, defaultProvider, providers);

      const res = await fetch(`${API_BASE}/api/admin/payment-routing`, {
        method: "PUT",
        headers: authHeaders({ "X-COUNTRY-CODE": selectedCountryCode }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save config");

      await loadRouting(selectedCountryCode);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const dualGateways = PROVIDERS.filter((p) => p.section === "BOTH");
  const sdkOnlyGateways = PROVIDERS.filter((p) => p.section === "SDK");
  const redirectOnlyGateways = PROVIDERS.filter((p) => p.section === "REDIRECT");

  return (
    <div style={{ padding: 20, maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Payment Routing</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Configure gateways per country. Backend will route payments using these settings (SDK or REDIRECT).
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

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "white",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 320 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Country</label>
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

          <div style={{ minWidth: 260 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Default provider</label>
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(normalizeGatewayEnum(e.target.value))}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
              disabled={loading}
            >
              {PROVIDERS.map((p) => (
                <option key={p.gateway} value={p.gateway}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              onClick={() => selectedCountryCode && loadRouting(selectedCountryCode)}
              disabled={loading || saving}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reload
            </button>

            <button
              onClick={save}
              disabled={saving || loading || !selectedCountryCode}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: saving ? "#9ca3af" : "#111827",
                color: "white",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {selectedCountry ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Currency: <b>{selectedCountry.currency}</b>
          </div>
        ) : null}
      </div>

      <Section title="Dual-Mode Gateways" description="Gateways that can run as SDK or Redirect (recommended).">
        <ProviderList
          providersMeta={dualGateways}
          providersState={providers}
          defaultProvider={defaultProvider}
          onUpdate={updateProvider}
          onUpdateSdkConfig={updateProviderSdkConfig}
          onUpdateRedirectConfig={updateProviderRedirectConfig}
        />
      </Section>

      <div style={{ height: 16 }} />

      <Section title="SDK-Only Gateways" description="Gateways that only run inside the app (SDK).">
        <ProviderList
          providersMeta={sdkOnlyGateways}
          providersState={providers}
          defaultProvider={defaultProvider}
          onUpdate={updateProvider}
          onUpdateSdkConfig={updateProviderSdkConfig}
          onUpdateRedirectConfig={updateProviderRedirectConfig}
        />
      </Section>

      <div style={{ height: 16 }} />

      <Section title="Redirect-Only Gateways" description="Gateways that only redirect to hosted pages.">
        <ProviderList
          providersMeta={redirectOnlyGateways}
          providersState={providers}
          defaultProvider={defaultProvider}
          onUpdate={updateProvider}
          onUpdateSdkConfig={updateProviderSdkConfig}
          onUpdateRedirectConfig={updateProviderRedirectConfig}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "white",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>{description}</div>
      </div>
      {children}
    </div>
  );
}

function ProviderList({
  providersMeta,
  providersState,
  defaultProvider,
  onUpdate,
  onUpdateSdkConfig,
  onUpdateRedirectConfig,
}: {
  providersMeta: UiProvider[];
  providersState: ProviderArrayItem[];
  defaultProvider: GatewayEnum;
  onUpdate: (gateway: GatewayEnum, patch: Partial<ProviderArrayItem>) => void;
  onUpdateSdkConfig: (gateway: GatewayEnum, patch: Record<string, any>) => void;
  onUpdateRedirectConfig: (gateway: GatewayEnum, patch: Record<string, any>) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {providersMeta.map((meta) => {
        const p =
          providersState.find((x) => x.gateway === meta.gateway) ||
          ({
            gateway: meta.gateway,
            flowType: meta.supportsRedirect ? "REDIRECT" : "SDK",
            enabled: false,
            priority: 0,
            sdkConfig: {},
            redirectConfig: {},
            config: {},
          } as ProviderArrayItem);

        const isDefault = defaultProvider === meta.gateway;

        return (
          <div
            key={meta.gateway}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{meta.label}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Gateway enum: <b>{meta.gateway}</b>
                </div>
              </div>

              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{p.enabled ? "ENABLED" : "DISABLED"}</span>
                <input
                  type="checkbox"
                  checked={!!p.enabled}
                  onChange={(e) => onUpdate(meta.gateway, { enabled: e.target.checked })}
                  style={{ width: 20, height: 20 }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ minWidth: 240 }}>
                <label style={{ fontSize: 12, opacity: 0.75 }}>Flow Type</label>
                <select
                  value={p.flowType}
                  onChange={(e) => onUpdate(meta.gateway, { flowType: normalizeFlowType(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                  }}
                  disabled={!p.enabled}
                >
                  <option value="REDIRECT" disabled={!meta.supportsRedirect}>
                    REDIRECT (WebView / Hosted)
                  </option>
                  <option value="SDK" disabled={!meta.supportsSdk}>
                    SDK (In-app)
                  </option>
                </select>
              </div>

              <div style={{ minWidth: 160 }}>
                <label style={{ fontSize: 12, opacity: 0.75 }}>Priority</label>
                <input
                  type="number"
                  value={String(p.priority ?? 0)}
                  onChange={(e) => onUpdate(meta.gateway, { priority: Number(e.target.value) })}
                  disabled={!p.enabled}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: !p.enabled ? "#f9fafb" : "white",
                    opacity: !p.enabled ? 0.7 : 1,
                  }}
                />
              </div>

              {isDefault ? (
                <div style={{ fontSize: 12, opacity: 0.8, alignSelf: "flex-end" }}>
                  ⭐ This provider is set as <b>DEFAULT</b> for this country.
                </div>
              ) : null}
            </div>

            {p.flowType === "SDK" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <Input
                  label="SDK Public Key"
                  value={String(p.sdkConfig?.publicKey || "")}
                  onChange={(v) => onUpdateSdkConfig(meta.gateway, { publicKey: v })}
                  disabled={!p.enabled}
                />
                <Input
                  label="Merchant / Account ID"
                  value={String(p.sdkConfig?.merchantId || "")}
                  onChange={(v) => onUpdateSdkConfig(meta.gateway, { merchantId: v })}
                  disabled={!p.enabled}
                />
                <Input
                  label="Environment (test/live)"
                  value={String(p.sdkConfig?.environment || "")}
                  onChange={(v) => onUpdateSdkConfig(meta.gateway, { environment: v })}
                  disabled={!p.enabled}
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <Input
                  label="Redirect Return URL (optional)"
                  value={String(p.redirectConfig?.returnUrl || "")}
                  onChange={(v) => onUpdateRedirectConfig(meta.gateway, { returnUrl: v })}
                  disabled={!p.enabled}
                />
                <Input
                  label="Cancel URL (optional)"
                  value={String(p.redirectConfig?.cancelUrl || "")}
                  onChange={(v) => onUpdateRedirectConfig(meta.gateway, { cancelUrl: v })}
                  disabled={!p.enabled}
                />
                <Input
                  label="Webhook Secret (display-only)"
                  value={String(p.redirectConfig?.webhookSecret || "")}
                  onChange={(v) => onUpdateRedirectConfig(meta.gateway, { webhookSecret: v })}
                  disabled={!p.enabled}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, opacity: 0.75 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid #d1d5db",
          width: "100%",
          background: disabled ? "#f9fafb" : "white",
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}