// components/country/country-switcher.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type Country = {
  _id?: string;
  code: string;
  name: string;
  currency?: string;
  isActive?: boolean;
};

type Props = {
  value?: string;
  onChange?: (countryCode: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

const STORAGE_KEY = "countryCode";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function normalizeIso2(v: any) {
  const code = String(v || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "ZA";
}

function authHeaders(extra: Record<string, string> = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const countryCode =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(countryCode ? { "X-COUNTRY-CODE": normalizeIso2(countryCode) } : {}),
    ...extra,
  };
}

export default function CountrySwitcher({
  value,
  onChange,
  disabled = false,
  label = "Country workspace",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value) return normalizeIso2(value);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeIso2(saved);
    }
    return "ZA";
  });

  const selected = useMemo(() => {
    return countries.find((c) => c.code === internalValue) || null;
  }, [countries, internalValue]);

  async function loadCountries() {
    setLoading(true);
    try {
      // ✅ Use admin countries endpoint (global list)
      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load countries");

      const list: Country[] = Array.isArray(data?.countries) ? data.countries : [];
      setCountries(list);

      // ✅ Backend echoes workspaceCountryCode; prefer it if valid
      const serverWorkspace = normalizeIso2(data?.workspaceCountryCode || internalValue);

      // ✅ If current selection not present, pick first active
      let next = serverWorkspace;
      if (list.length > 0 && !list.some((c) => c.code === next)) {
        const firstActive = list.find((c) => c.isActive !== false) || list[0];
        next = normalizeIso2(firstActive.code);
      }

      // ✅ Persist + notify
      setInternalValue(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
        window.dispatchEvent(
          new CustomEvent("towmech:country-changed", { detail: { countryCode: next } })
        );
      }
      onChange?.(next);
    } catch (_) {
      // fallback
      const fallback = "ZA";
      setCountries([{ code: "ZA", name: "South Africa", currency: "ZAR", isActive: true }]);
      setInternalValue(fallback);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, fallback);
        window.dispatchEvent(
          new CustomEvent("towmech:country-changed", { detail: { countryCode: fallback } })
        );
      }
      onChange?.(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If parent controls value, sync it
  useEffect(() => {
    if (!value) return;
    const v = normalizeIso2(value);
    if (v !== internalValue) setInternalValue(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ✅ Listen for global changes (other components/tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const v = normalizeIso2(e.newValue);
      setInternalValue(v);
    };

    const onCustom = (e: Event) => {
      const ce = e as CustomEvent;
      const v = normalizeIso2(ce?.detail?.countryCode);
      setInternalValue(v);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("towmech:country-changed", onCustom as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("towmech:country-changed", onCustom as any);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 240,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>

      <select
        value={internalValue}
        disabled={disabled || loading}
        onChange={(e) => {
          const code = normalizeIso2(e.target.value);
          setInternalValue(code);

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, code);
            window.dispatchEvent(
              new CustomEvent("towmech:country-changed", { detail: { countryCode: code } })
            );
          }

          onChange?.(code);
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #d1d5db",
          background: disabled ? "#f3f4f6" : "white",
          fontWeight: 800,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {countries.map((c) => (
          <option key={c._id || c.code} value={c.code}>
            {c.code} — {c.name}
            {c.isActive === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>

      {selected ? (
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Currency: <b>{selected.currency || "-"}</b>
        </div>
      ) : null}
    </div>
  );
}