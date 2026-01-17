"use client";

import { useEffect, useState } from "react";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { fetchPricingConfig, updatePricingConfig } from "@/lib/api/pricing";

type ProviderPricing = {
  baseFee: number;
  perKmFee: number;
  nightFee: number;
  weekendFee: number;
};

type BookingFees = {
  towTruckPercent?: number;
  mechanicFixed?: number;
};

type PricingConfig = {
  currency?: string;

  providerBasePricing?: {
    towTruck?: ProviderPricing;
    mechanic?: ProviderPricing;
  };

  bookingFees?: BookingFees;
};

const defaultTowTruck: ProviderPricing = {
  baseFee: 50,
  perKmFee: 15,
  nightFee: 0,
  weekendFee: 0,
};

const defaultMechanic: ProviderPricing = {
  baseFee: 30,
  perKmFee: 10,
  nightFee: 0,
  weekendFee: 0,
};

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);

  const [activeTab, setActiveTab] = useState<"TowTruck" | "Mechanic">("TowTruck");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPricingConfig();
      const cfg = data?.config;

      const towTruck = cfg?.providerBasePricing?.towTruck || defaultTowTruck;
      const mechanic = cfg?.providerBasePricing?.mechanic || defaultMechanic;

      const bookingFees: BookingFees = {
        towTruckPercent: cfg?.bookingFees?.towTruckPercent ?? 15,
        mechanicFixed: cfg?.bookingFees?.mechanicFixed ?? 200,
      };

      setConfig({
        currency: cfg?.currency || "ZAR",
        providerBasePricing: {
          towTruck,
          mechanic,
        },
        bookingFees,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load pricing config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const updateField = (
    providerType: "towTruck" | "mechanic",
    field: keyof ProviderPricing,
    value: number
  ) => {
    if (!config) return;

    const updated: PricingConfig = {
      ...config,
      providerBasePricing: {
        ...config.providerBasePricing,
        [providerType]: {
          ...config.providerBasePricing?.[providerType],
          [field]: value,
        },
      },
    };

    setConfig(updated);
  };

  const handleSave = async () => {
    if (!config?.providerBasePricing) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // ✅ IMPORTANT:
      // Mechanic booking fee in backend uses bookingFees.mechanicFixed (fallback),
      // not providerBasePricing.mechanic.baseFee.
      const mechanicBaseFee = config.providerBasePricing.mechanic?.baseFee ?? defaultMechanic.baseFee;

      const payload: any = {
        currency: config.currency,
        providerBasePricing: config.providerBasePricing,
        bookingFees: {
          towTruckPercent: config.bookingFees?.towTruckPercent ?? 15,
          mechanicFixed:
            activeTab === "Mechanic"
              ? mechanicBaseFee // ✅ make dashboard mechanic baseFee drive booking fee
              : config.bookingFees?.mechanicFixed ?? 200,
        },
      };

      const res = await updatePricingConfig(payload);

      // keep local state consistent too
      const nextCfg = res?.config || config;
      setConfig({
        ...config,
        ...nextCfg,
        bookingFees: {
          towTruckPercent: nextCfg?.bookingFees?.towTruckPercent ?? payload.bookingFees.towTruckPercent,
          mechanicFixed: nextCfg?.bookingFees?.mechanicFixed ?? payload.bookingFees.mechanicFixed,
        },
      });

      setMessage("✅ Provider pricing updated successfully!");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update provider pricing");
    } finally {
      setSaving(false);
    }
  };

  const currentProviderKey = activeTab === "TowTruck" ? "towTruck" : "mechanic";

  const currentPricing =
    config?.providerBasePricing?.[currentProviderKey] ||
    (activeTab === "TowTruck" ? defaultTowTruck : defaultMechanic);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pricing & Commission Controls"
        description="Control TowTruck and Mechanic pricing, including night and weekend incentives."
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Provider Pricing Rules</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure base fares and incentives per provider type.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={
                activeTab === "TowTruck"
                  ? "bg-indigo-600 cursor-pointer"
                  : "bg-slate-200 text-slate-700 cursor-pointer"
              }
              onClick={() => setActiveTab("TowTruck")}
            >
              TowTruck
            </Badge>

            <Badge
              className={
                activeTab === "Mechanic"
                  ? "bg-orange-600 cursor-pointer"
                  : "bg-slate-200 text-slate-700 cursor-pointer"
              }
              onClick={() => setActiveTab("Mechanic")}
            >
              Mechanic
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading pricing config...
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-700">{message}</div>}

          {!loading && config && (
            <>
              {/* Currency */}
              <div className="space-y-2 max-w-xs">
                <label className="text-sm font-medium text-slate-700">
                  Currency
                </label>
                <Input
                  value={config.currency || ""}
                  onChange={(e) =>
                    setConfig({ ...config, currency: e.target.value })
                  }
                  placeholder="ZAR"
                />
              </div>

              {/* Pricing Fields */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Base Fee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Base Fee
                  </label>
                  <Input
                    type="number"
                    value={currentPricing.baseFee ?? 0}
                    onChange={(e) =>
                      updateField(
                        currentProviderKey,
                        "baseFee",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                {/* Per KM Fee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Per KM Fee
                  </label>
                  <Input
                    type="number"
                    value={currentPricing.perKmFee ?? 0}
                    onChange={(e) =>
                      updateField(
                        currentProviderKey,
                        "perKmFee",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                {/* Night Fee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Night Fee (20:00 - 06:00)
                  </label>
                  <Input
                    type="number"
                    value={currentPricing.nightFee ?? 0}
                    onChange={(e) =>
                      updateField(
                        currentProviderKey,
                        "nightFee",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                {/* Weekend Fee */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Weekend Fee (Sat/Sun)
                  </label>
                  <Input
                    type="number"
                    value={currentPricing.weekendFee ?? 0}
                    onChange={(e) =>
                      updateField(
                        currentProviderKey,
                        "weekendFee",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Provider Pricing"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}