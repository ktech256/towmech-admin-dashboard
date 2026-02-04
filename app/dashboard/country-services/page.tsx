"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// ============================
// Types
// ============================
type ServiceFlags = {
  towingEnabled: boolean;
  mechanicEnabled: boolean;
  emergencySupportEnabled: boolean; // canonical
  insuranceEnabled: boolean;
  chatEnabled: boolean;
  ratingsEnabled: boolean;

  // extended (already supported by backend + model; safe to keep)
  winchRecoveryEnabled: boolean;
  roadsideAssistanceEnabled: boolean;
  jumpStartEnabled: boolean;
  tyreChangeEnabled: boolean;
  fuelDeliveryEnabled: boolean;
  lockoutEnabled: boolean;

  // legacy alias (backend keeps in sync)
  supportEnabled?: boolean;
};

type CountryServiceConfig = {
  _id?: string;
  countryCode: string;
  services: ServiceFlags;
  payments?: any;
  createdAt?: string;
  updatedAt?: string;
};

type ApiGetResponse = { config: CountryServiceConfig };
type ApiPutResponse = { message: string; config: CountryServiceConfig };

// ============================
// Defaults (match backend defaults)
// ============================
const DEFAULT_SERVICES: ServiceFlags = {
  towingEnabled: true,
  mechanicEnabled: true,
  emergencySupportEnabled: true,
  insuranceEnabled: false,
  chatEnabled: true,
  ratingsEnabled: true,

  winchRecoveryEnabled: false,
  roadsideAssistanceEnabled: false,
  jumpStartEnabled: false,
  tyreChangeEnabled: false,
  fuelDeliveryEnabled: false,
  lockoutEnabled: false,
};

// ============================
// Helpers
// ============================
function normalizeServicesFromApi(input: any): ServiceFlags {
  const s = input && typeof input === "object" ? input : {};

  // Support legacy dashboard keys too (towing/mechanic/etc),
  // but canonical is "*Enabled".
  const emergency =
    typeof s.emergencySupportEnabled === "boolean"
      ? s.emergencySupportEnabled
      : typeof s.supportEnabled === "boolean"
        ? s.supportEnabled
        : typeof s.emergencySupport === "boolean"
          ? s.emergencySupport
          : typeof s.support === "boolean"
            ? s.support
            : DEFAULT_SERVICES.emergencySupportEnabled;

  return {
    towingEnabled:
      typeof s.towingEnabled === "boolean"
        ? s.towingEnabled
        : typeof s.towing === "boolean"
          ? s.towing
          : DEFAULT_SERVICES.towingEnabled,

    mechanicEnabled:
      typeof s.mechanicEnabled === "boolean"
        ? s.mechanicEnabled
        : typeof s.mechanic === "boolean"
          ? s.mechanic
          : DEFAULT_SERVICES.mechanicEnabled,

    emergencySupportEnabled: emergency,

    insuranceEnabled:
      typeof s.insuranceEnabled === "boolean"
        ? s.insuranceEnabled
        : typeof s.insurance === "boolean"
          ? s.insurance
          : DEFAULT_SERVICES.insuranceEnabled,

    chatEnabled:
      typeof s.chatEnabled === "boolean"
        ? s.chatEnabled
        : typeof s.chat === "boolean"
          ? s.chat
          : DEFAULT_SERVICES.chatEnabled,

    ratingsEnabled:
      typeof s.ratingsEnabled === "boolean"
        ? s.ratingsEnabled
        : typeof s.ratings === "boolean"
          ? s.ratings
          : DEFAULT_SERVICES.ratingsEnabled,

    winchRecoveryEnabled:
      typeof s.winchRecoveryEnabled === "boolean"
        ? s.winchRecoveryEnabled
        : DEFAULT_SERVICES.winchRecoveryEnabled,

    roadsideAssistanceEnabled:
      typeof s.roadsideAssistanceEnabled === "boolean"
        ? s.roadsideAssistanceEnabled
        : DEFAULT_SERVICES.roadsideAssistanceEnabled,

    jumpStartEnabled:
      typeof s.jumpStartEnabled === "boolean"
        ? s.jumpStartEnabled
        : DEFAULT_SERVICES.jumpStartEnabled,

    tyreChangeEnabled:
      typeof s.tyreChangeEnabled === "boolean"
        ? s.tyreChangeEnabled
        : DEFAULT_SERVICES.tyreChangeEnabled,

    fuelDeliveryEnabled:
      typeof s.fuelDeliveryEnabled === "boolean"
        ? s.fuelDeliveryEnabled
        : DEFAULT_SERVICES.fuelDeliveryEnabled,

    lockoutEnabled:
      typeof s.lockoutEnabled === "boolean"
        ? s.lockoutEnabled
        : DEFAULT_SERVICES.lockoutEnabled,

    // keep alias synced locally too (optional)
    supportEnabled:
      typeof s.supportEnabled === "boolean"
        ? s.supportEnabled
        : typeof emergency === "boolean"
          ? emergency
          : undefined,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ============================
// Page
// ============================
export default function CountryServicesPage() {
  const [countryCode, setCountryCode] = useState("ZA");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<CountryServiceConfig | null>(null);

  const services = useMemo<ServiceFlags>(() => {
    if (!config?.services) return DEFAULT_SERVICES;
    return normalizeServicesFromApi(config.services);
  }, [config]);

  function setService(key: keyof ServiceFlags, value: boolean) {
    setConfig((prev) => {
      if (!prev) return prev;

      const nextServices = {
        ...normalizeServicesFromApi(prev.services),
        [key]: value,
      };

      // keep alias synced for emergency/support
      if (key === "emergencySupportEnabled") {
        nextServices.supportEnabled = value;
      }
      if (key === "supportEnabled") {
        nextServices.emergencySupportEnabled = value as any;
      }

      return {
        ...prev,
        services: nextServices,
      };
    });
  }

  async function loadCountryServiceConfig(cc: string) {
    setLoading(true);
    try {
      const data = await fetchJson<ApiGetResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/country-services/${cc}`
      );

      const cfg = data.config;
      cfg.services = normalizeServicesFromApi(cfg.services);

      setConfig(cfg);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load config");
      setConfig({
        countryCode: cc,
        services: DEFAULT_SERVICES,
      });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!config) return;

    setSaving(true);
    try {
      const payload = {
        countryCode: config.countryCode,
        services: normalizeServicesFromApi(config.services),
      };

      const data = await fetchJson<ApiPutResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/country-services`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      // Apply server-returned canonical state
      const cfg = data.config;
      cfg.services = normalizeServicesFromApi(cfg.services);

      setConfig(cfg);

      toast.success(data.message || "Saved");
      await loadCountryServiceConfig(countryCode);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadCountryServiceConfig(countryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  const serviceCards: Array<{
    key: keyof ServiceFlags;
    title: string;
    description: string;
  }> = [
    {
      key: "towingEnabled",
      title: "Towing",
      description: "Enable towing jobs + tow truck provider flows",
    },
    {
      key: "mechanicEnabled",
      title: "Mechanic",
      description: "Enable mechanic jobs + mechanic provider flows",
    },
    {
      key: "emergencySupportEnabled",
      title: "Emergency Support",
      description: "Emergency roadside support service",
    },
    {
      key: "insuranceEnabled",
      title: "Insurance",
      description: "Enable insurance partner booking flow (codes + invoicing)",
    },
    {
      key: "chatEnabled",
      title: "Chat",
      description: "Enable in-app chat (customer ↔ provider)",
    },
    {
      key: "ratingsEnabled",
      title: "Ratings",
      description: "Enable ratings system after job completion",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Country Services</h1>
          <p className="text-sm text-muted-foreground">
            Enable / disable services per country (feature flags).
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadCountryServiceConfig(countryCode)}
            disabled={loading || saving}
          >
            Reload
          </Button>
          <Button onClick={save} disabled={loading || saving || !config}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Country</div>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={loading || saving}
          >
            <option value="ZA">ZA — South Africa</option>
            {/* add more countries here */}
          </select>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Services for {countryCode}</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceCards.map((s) => {
              const value = !!services[s.key];

              return (
                <div
                  key={String(s.key)}
                  className="border rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium">{value ? "ON" : "OFF"}</div>
                    <Checkbox
                      checked={value}
                      onCheckedChange={(v) => setService(s.key, !!v)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2">
          Note: Services are feature flags only. Backend must still enforce restrictions
          (e.g. block towing requests if towing is off).
        </p>
      </Card>
    </div>
  );
}