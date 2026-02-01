"use client";

import React, { useEffect, useMemo, useState } from "react";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
  defaultLanguage?: string;
  supportedLanguages?: string[];
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CountriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    currency: "",
    defaultLanguage: "en",
    supportedLanguages: "en",
    timezone: "Africa/Johannesburg",
    isActive: true,
  });

  const canSubmit = useMemo(() => {
    return (
      form.code.trim().length >= 2 &&
      form.name.trim().length >= 2 &&
      form.currency.trim().length >= 3
    );
  }, [form]);

  async function loadCountries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to load countries");
      }

      const data = await res.json();
      setCountries(Array.isArray(data?.countries) ? data.countries : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  async function createCountry() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        currency: form.currency.trim().toUpperCase(),
        defaultLanguage: form.defaultLanguage.trim(),
        supportedLanguages: form.supportedLanguages
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        timezone: form.timezone.trim(),
        isActive: form.isActive,
      };

      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create country");
      }

      setForm({
        code: "",
        name: "",
        currency: "",
        defaultLanguage: "en",
        supportedLanguages: "en",
        timezone: "Africa/Johannesburg",
        isActive: true,
      });

      await loadCountries();
    } catch (e: any) {
      setError(e?.message || "Failed to create country");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(country: Country) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/countries/${country._id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !country.isActive }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update country");

      setCountries((prev) =>
        prev.map((c) =>
          c._id === country._id ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update country");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCountry(country: Country) {
    const ok = confirm(
      `Delete country ${country.code} (${country.name})?\n\nThis will remove it from the system.`
    );
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/countries/${country._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to delete country");

      setCountries((prev) => prev.filter((c) => c._id !== country._id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete country");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Countries
      </h1>
      <p style={{ marginBottom: 20, opacity: 0.8 }}>
        Manage TowMech Global countries (activation, currency, language, timezone).
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
          marginBottom: 22,
          background: "white",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Add Country
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Country Code</label>
            <input
              value={form.code}
              onChange={(e) =>
                setForm((p) => ({ ...p, code: e.target.value }))
              }
              placeholder="ZA"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Country Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="South Africa"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Currency</label>
            <input
              value={form.currency}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              placeholder="ZAR"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>
              Default Language
            </label>
            <input
              value={form.defaultLanguage}
              onChange={(e) =>
                setForm((p) => ({ ...p, defaultLanguage: e.target.value }))
              }
              placeholder="en"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>
              Supported Languages (comma separated)
            </label>
            <input
              value={form.supportedLanguages}
              onChange={(e) =>
                setForm((p) => ({ ...p, supportedLanguages: e.target.value }))
              }
              placeholder="en,zu,af"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Timezone</label>
            <input
              value={form.timezone}
              onChange={(e) =>
                setForm((p) => ({ ...p, timezone: e.target.value }))
              }
              placeholder="Africa/Johannesburg"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
            />
            Active
          </label>

          <button
            onClick={createCountry}
            disabled={!canSubmit || saving}
            style={{
              marginLeft: "auto",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: saving ? "#9ca3af" : "#111827",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "Add Country"}
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          background: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Country List</h2>
          <button
            onClick={loadCountries}
            disabled={loading}
            style={{
              marginLeft: "auto",
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 16, opacity: 0.7 }}>Loading...</div>
        ) : countries.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>
            No countries yet. Add your first country above.
          </div>
        ) : (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Code
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Name
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Currency
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Languages
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Timezone
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Status
                  </th>
                  <th style={{ padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c._id}>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: 700,
                      }}
                    >
                      {c.code}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {c.currency}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {(c.supportedLanguages || []).join(", ") || "-"}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {c.timezone || "-"}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          background: c.isActive ? "#ecfdf5" : "#fef2f2",
                        }}
                      >
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={saving}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #d1d5db",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => deleteCountry(c)}
                        disabled={saving}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #ef4444",
                          background: "#fee2e2",
                          color: "#991b1b",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}