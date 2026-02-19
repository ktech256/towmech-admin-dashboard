"use client";

import { useEffect, useState } from "react";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { useCountryStore } from "@/lib/store/countryStore";
import { fetchSystemSettings, updateSystemSettings } from "@/lib/api/settings";

const PAYMENT_GATEWAYS = [
  { value: "YOCO", label: "Yoco" },
  { value: "PAYFAST", label: "PayFast" },
  { value: "PAYGATE", label: "PayGate" },
  { value: "PEACH_PAYMENTS", label: "Peach Payments (Embedded Checkout)" },
  { value: "PAYU", label: "PayU" },
  { value: "IKHOKHA", label: "iKhokha" },
  { value: "DPO_GROUP", label: "DPO PayGate / DPO Group" },
  { value: "OZOW", label: "Ozow" },
  { value: "SNAPSCAN", label: "SnapScan" },
  { value: "ZAPPER", label: "Zapper" },
  { value: "PAYFLEX", label: "PayFlex" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<"general" | "peak" | "integrations">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ multi-country scope
  const { countryCode } = useCountryStore();

  const [settings, setSettings] = useState<any>({
    platformName: "",
    supportEmail: "",
    supportPhone: "",

    nightFeeEnabled: false,
    nightFeePercentage: 0,

    weekendFeeEnabled: false,
    weekendFeePercentage: 0,

    integrations: {
      paymentGateway: "YOCO",

      paymentPublicKey: "",
      paymentSecretKey: "",
      paymentWebhookSecret: "",

      // ✅ Google
      googleMapsKey: "",

      // ✅ SMS
      smsProvider: "",
      smsApiKey: "",

      // ✅ IKHOKHA (Optional entityId)
      ikhokhaEntityId: "",
      ikhokhaApiKey: "",
      ikhokhaSecretKey: "",
    },

    adminNote: "",
  });

  const loadSettings = async () => {
    if (!countryCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSystemSettings();
      if (data?.settings) {
        setSettings((prev: any) => ({
          ...prev,
          ...data.settings,
          integrations: {
            ...prev.integrations,
            ...(data.settings.integrations || {}),
          },
        }));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to load system settings ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  const handleSave = async () => {
    if (!countryCode) {
      alert("Select a country first ❌");
      return;
    }

    setSaving(true);
    try {
      await updateSystemSettings(settings);
      alert("Settings saved ✅");
      await loadSettings();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  if (!countryCode) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Select a country to manage settings.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="System Settings"
        description="Manage platform configuration, peak fees, zones and integration keys."
      />

      {/* ✅ Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "general" ? "default" : "outline"}
          onClick={() => setTab("general")}
        >
          General
        </Button>
        <Button
          variant={tab === "peak" ? "default" : "outline"}
          onClick={() => setTab("peak")}
        >
          Peak Fees
        </Button>
        <Button
          variant={tab === "integrations" ? "default" : "outline"}
          onClick={() => setTab("integrations")}
        >
          Integrations
        </Button>
      </div>

      {/* ✅ GENERAL SETTINGS */}
      {tab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Platform Name"
              value={settings.platformName || ""}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
            />

            <Input
              placeholder="Support Email"
              value={settings.supportEmail || ""}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
            />

            <Input
              placeholder="Support Phone"
              value={settings.supportPhone || ""}
              onChange={(e) =>
                setSettings({ ...settings, supportPhone: e.target.value })
              }
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">
                Admin Notes / Internal Instructions
              </p>
              <Textarea
                placeholder="Example: Support agents must always request proof of payment before refund..."
                value={settings.adminNote || ""}
                onChange={(e) =>
                  setSettings({ ...settings, adminNote: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ PEAK FEES */}
      {tab === "peak" && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Fees</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ✅ Night Fee */}
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">Night Fee</p>
                <p className="text-xs text-muted-foreground">
                  Adds extra percentage at night (motivates night workers).
                </p>
              </div>
              <Switch
                checked={!!settings.nightFeeEnabled}
                onCheckedChange={(v) =>
                  setSettings({ ...settings, nightFeeEnabled: v })
                }
              />
            </div>

            <Input
              type="number"
              placeholder="Night Fee %"
              value={settings.nightFeePercentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  nightFeePercentage: Number(e.target.value),
                })
              }
            />

            {/* ✅ Weekend Fee */}
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">Weekend Fee</p>
                <p className="text-xs text-muted-foreground">
                  Adds extra percentage on weekends.
                </p>
              </div>
              <Switch
                checked={!!settings.weekendFeeEnabled}
                onCheckedChange={(v) =>
                  setSettings({ ...settings, weekendFeeEnabled: v })
                }
              />
            </div>

            <Input
              type="number"
              placeholder="Weekend Fee %"
              value={settings.weekendFeePercentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  weekendFeePercentage: Number(e.target.value),
                })
              }
            />
          </CardContent>
        </Card>
      )}

      {/* ✅ INTEGRATIONS */}
      {tab === "integrations" && (
        <Card>
          <CardHeader>
            <CardTitle>Integrations & API Keys</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* ✅ Payment Gateway (LEGACY) */}
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                Payment Gateway (Legacy)
                <Badge variant="secondary">Legacy</Badge>
                <Badge variant="outline">Read-only</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Payment routing is now controlled by the <b>Payment Routing</b> page per country.
                This legacy setting is kept only for backward compatibility and will not be used for routing.
              </p>

              <select
                className="w-full rounded-md border px-3 py-2 text-sm opacity-70"
                value={settings.integrations.paymentGateway}
                disabled
                onChange={() => {}}
              >
                {PAYMENT_GATEWAYS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Payment Public Key"
                value={settings.integrations.paymentPublicKey || ""}
                disabled
                onChange={() => {}}
              />

              <Input
                placeholder="Payment Secret Key (backend only)"
                value={settings.integrations.paymentSecretKey || ""}
                disabled
                onChange={() => {}}
              />

              <Input
                placeholder="Webhook Secret (optional)"
                value={settings.integrations.paymentWebhookSecret || ""}
                disabled
                onChange={() => {}}
              />
            </div>

            <Input
              placeholder="Google Maps Key (Android app will fetch this)"
              value={settings.integrations.googleMapsKey || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: {
                    ...settings.integrations,
                    googleMapsKey: e.target.value,
                  },
                })
              }
            />

            <Input
              placeholder="SMS Provider (optional)"
              value={settings.integrations.smsProvider || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: {
                    ...settings.integrations,
                    smsProvider: e.target.value,
                  },
                })
              }
            />

            <Input
              placeholder="SMS API Key (optional)"
              value={settings.integrations.smsApiKey || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  integrations: {
                    ...settings.integrations,
                    smsApiKey: e.target.value,
                  },
                })
              }
            />

            {/* ✅ iKhokha Keys (Legacy integrations bucket - keep for now) */}
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">
                iKhokha Keys (legacy integrations bucket)
              </p>
              <p className="text-xs text-muted-foreground">
                If you still use these fields, keep them. Phase 1 routing will move all payment configs
                into the Payment Routing page per country.
              </p>

              <Input
                placeholder="iKhokha Entity ID (optional)"
                value={settings.integrations.ikhokhaEntityId || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    integrations: {
                      ...settings.integrations,
                      ikhokhaEntityId: e.target.value,
                    },
                  })
                }
              />

              <Input
                placeholder="iKhokha API Key"
                value={settings.integrations.ikhokhaApiKey || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    integrations: {
                      ...settings.integrations,
                      ikhokhaApiKey: e.target.value,
                    },
                  })
                }
              />

              <Input
                placeholder="iKhokha Secret Key"
                value={settings.integrations.ikhokhaSecretKey || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    integrations: {
                      ...settings.integrations,
                      ikhokhaSecretKey: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ SAVE */}
      <Button className="w-full" disabled={saving} onClick={handleSave}>
        {saving ? "Saving..." : "Save Settings ✅"}
      </Button>
    </div>
  );
}