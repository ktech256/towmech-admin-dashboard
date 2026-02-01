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
  /**
   * If you already have a global country state store,
   * pass the selected country here.
   */
  value?: string;

  /**
   * Called when user selects a new country.
   */
  onChange?: (countryCode: string) => void;

  /**
   * Optional: lock selection
   */
  disabled?: boolean;

  /**
   * Optional: show label
   */
  label?: string;

  /**
   * Optional: CSS class
   */
  className?: string;
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

export default function CountrySwitcher({
  value,
  onChange,
  disabled = false,
  label = "Country workspace",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [internalValue, setInternalValue] = useState<string>(value || "ZA");

  const selected = useMemo(() => {
    return countries.find((c) => c.code === internalValue) || null;
  }, [countries, internalValue]);

  async function loadCountries() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load countries");

      const list: Country[] = Array.isArray(data?.countries) ? data.countries : [];
      setCountries(list);

      // Auto-select first active country if current selection isn't valid
      if (list.length > 0 && !list.some((c) => c.code === internalValue)) {
        const firstActive = list.find((c) => c.isActive !== false) || list[0];
        setInternalValue(firstActive.code);
        onChange?.(firstActive.code);
      }
    } catch (err) {
      // silently fail (dashboard still works)
      setCountries([
        { code: "ZA", name: "South Africa", currency: "ZAR", isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value && value !== internalValue) setInternalValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
          const code = e.target.value;
          setInternalValue(code);
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