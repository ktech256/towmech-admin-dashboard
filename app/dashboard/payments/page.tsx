// dashboard/app/dashboard/payments/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { computeProviderOwed, fetchPayments } from "@/lib/api/payments";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
};

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  status: string;

  provider?: string;
  providerReference?: string;
  createdAt?: string;
  paidAt?: string;

  refundedAt?: string;
  refundedBy?: {
    name?: string;
    email?: string;
  };

  refundReason?: string | null;

  customer?: {
    name?: string;
    email?: string;
  };

  job?: {
    _id?: string;
    roleNeeded?: string;
    status?: string;

    // If backend doesn't send this, no problem — we still block using provider === "INSURANCE"
    insurance?: {
      enabled?: boolean;
    };
  };
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

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtMoney(n: number, currency: string) {
  const v = Number(n || 0) || 0;
  return `${v.toLocaleString()} ${currency || "ZAR"}`;
}

function getStatusBadge(status: string) {
  if (status === "PAID") return <Badge className="bg-green-600">PAID</Badge>;
  if (status === "PENDING") return <Badge className="bg-yellow-600">PENDING</Badge>;
  if (status === "FAILED") return <Badge className="bg-red-600">FAILED</Badge>;
  if (status === "REFUNDED") return <Badge className="bg-slate-700">REFUNDED</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function fmtRefundedBy(p: Payment) {
  const name = p.refundedBy?.name?.trim();
  const email = p.refundedBy?.email?.trim();
  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  return "—";
}

function isInsurancePayment(p: Payment) {
  // Primary: provider says INSURANCE
  if ((p.provider || "").toUpperCase() === "INSURANCE") return true;
  // Secondary: job.insurance.enabled
  if (p.job?.insurance?.enabled === true) return true;
  return false;
}

export default function PaymentsPage() {
  const [view, setView] = useState<"CUSTOMERS" | "PROVIDERS">("CUSTOMERS");

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");

  const currency = useMemo(() => {
    const c = countries.find((x) => x.code === selectedCountryCode);
    return c?.currency || "ZAR";
  }, [countries, selectedCountryCode]);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [errorPayments, setErrorPayments] = useState<string | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);

  // Refund modal
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState("");

  // Provider owed
  const [fromDate, setFromDate] = useState<string>(todayYmd());
  const [toDate, setToDate] = useState<string>(todayYmd());
  const [providerId, setProviderId] = useState<string>("");
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [errorProviders, setErrorProviders] = useState<string | null>(null);
  const [providerResult, setProviderResult] =
    useState<ReturnType<typeof computeProviderOwed> | null>(null);

  async function loadCountries() {
    const res = await fetch(`${API_BASE}/api/admin/countries`, {
      method: "GET",
      headers: authHeaders(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load countries");

    const list: Country[] = Array.isArray(data?.countries) ? data.countries : [];
    setCountries(list);

    if (!selectedCountryCode && list.length > 0) {
      setSelectedCountryCode(list[0].code);
    }
  }

  async function loadPayments() {
    setLoadingPayments(true);
    setErrorPayments(null);

    try {
      const cc = (selectedCountryCode || "ZA").toUpperCase();

      const res = await fetch(`${API_BASE}/api/admin/payments?country=${cc}`, {
        method: "GET",
        headers: authHeaders({
          "x-country-code": cc,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load payments");

      setPayments((data?.payments || []) as Payment[]);
    } catch (e: any) {
      setErrorPayments(e?.message || "Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  }

  useEffect(() => {
    loadCountries().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode]);

  const filtered = useMemo(() => {
    if (!search) return payments;
    const s = search.toLowerCase();
    return payments.filter((p) => {
      return (
        (p.customer?.name || "").toLowerCase().includes(s) ||
        (p.customer?.email || "").toLowerCase().includes(s) ||
        (p.status || "").toLowerCase().includes(s) ||
        (p.provider || "").toLowerCase().includes(s)
      );
    });
  }, [payments, search]);

  const totals = useMemo(() => {
    const totalCount = payments.length;
    const totalPaid = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pending = payments.filter((p) => p.status === "PENDING").length;
    const refunded = payments.filter((p) => p.status === "REFUNDED").length;

    return { totalCount, totalPaid, pending, refunded };
  }, [payments]);

  function openRefund(p: Payment) {
    if (isInsurancePayment(p)) {
      alert("Insurance payments cannot be refunded ❌");
      return;
    }
    setRefundTarget(p);
    setRefundReason("");
    setRefundOpen(true);
  }

  async function confirmRefund() {
    if (!refundTarget) return;

    const reason = refundReason.trim();
    if (!reason) {
      alert("Refund reason is required ❌");
      return;
    }

    const cc = (selectedCountryCode || "ZA").toUpperCase();
    setActionLoadingId(refundTarget._id);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/payments/${refundTarget._id}/refund?country=${cc}`,
        {
          method: "PATCH",
          headers: authHeaders({
            "x-country-code": cc,
          }),
          body: JSON.stringify({ reason }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Refund failed");

      setRefundOpen(false);
      setRefundTarget(null);
      setRefundReason("");

      await loadPayments();
      alert("Payment refunded ✅");
    } catch (e: any) {
      alert(e?.message || "Refund failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleMarkPaid(jobId?: string, paymentId?: string) {
    if (!jobId) {
      alert("Job ID missing for this payment ❌");
      return;
    }

    const ok = window.confirm("Are you sure you want to mark this as PAID?");
    if (!ok) return;

    const cc = (selectedCountryCode || "ZA").toUpperCase();
    setActionLoadingId(paymentId || jobId);

    try {
      // ✅ IMPORTANT:
      // This endpoint MUST exist in your backend.
      // If your backend uses a different mark-paid route, change ONLY this URL:
      const res = await fetch(`${API_BASE}/api/admin/jobs/${jobId}/mark-paid?country=${cc}`, {
        method: "PATCH",
        headers: authHeaders({
          "x-country-code": cc,
        }),
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Mark paid failed");

      await loadPayments();
      alert("Payment marked PAID ✅");
    } catch (e: any) {
      alert(e?.message || "Mark paid failed ❌");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function runProviderOwedCompute() {
    if (!selectedCountryCode) {
      setErrorProviders("Select a country");
      return;
    }

    setLoadingProviders(true);
    setErrorProviders(null);
    setProviderResult(null);

    try {
      const p = await fetchPayments(selectedCountryCode);
      const r = computeProviderOwed({
        payments: p,
        providerId: providerId.trim() || undefined,
        fromYmd: fromDate,
        toYmd: toDate,
      });

      setProviderResult(r);
    } catch (e: any) {
      setErrorProviders(e?.message || "Failed to compute provider owed");
    } finally {
      setLoadingProviders(false);
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Payments & Financial Controls"
        description="Track booking fees, payments, refunds, and revenue movement."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={view === "CUSTOMERS" ? "default" : "outline"}
          onClick={() => setView("CUSTOMERS")}
        >
          Customer Payments (Money IN)
        </Button>
        <Button
          variant={view === "PROVIDERS" ? "default" : "outline"}
          onClick={() => setView("PROVIDERS")}
        >
          Provider Owed (Money OUT)
        </Button>

        {countries.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Country</span>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
            >
              {countries.map((c) => (
                <option key={c._id} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {fmtMoney(totals.totalPaid, currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Refunded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.refunded}</div>
          </CardContent>
        </Card>
      </div>

      {view === "CUSTOMERS" ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Transactions</CardTitle>

              <div className="flex items-center gap-2">
                <Input
                  className="max-w-sm"
                  placeholder="Search customer, status, provider..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={loadPayments}
                  disabled={loadingPayments}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingPayments && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading payments...
                </div>
              )}

              {errorPayments && (
                <div className="py-10 text-center text-sm text-red-600">
                  {errorPayments}
                </div>
              )}

              {!loadingPayments && !errorPayments && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Paid At</TableHead>
                        <TableHead>Refunded At</TableHead>
                        <TableHead>Refunded By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-sm text-muted-foreground"
                          >
                            No payments found ✅
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((p) => {
                          const busy = actionLoadingId === p._id;
                          const insurance = isInsurancePayment(p);

                          return (
                            <TableRow key={p._id}>
                              <TableCell className="font-medium">
                                {p.customer?.name || "—"}
                                <div className="text-xs text-muted-foreground">
                                  {p.customer?.email || ""}
                                </div>
                              </TableCell>

                              <TableCell>
                                {Number(p.amount || 0).toLocaleString()}{" "}
                                {p.currency || currency}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(p.status)}
                                  {insurance ? (
                                    <Badge variant="secondary" className="border">
                                      INSURANCE
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell>{p.provider || "—"}</TableCell>

                              <TableCell className="text-xs">{fmtDateTime(p.paidAt)}</TableCell>
                              <TableCell className="text-xs">{fmtDateTime(p.refundedAt)}</TableCell>
                              <TableCell className="text-xs">{fmtRefundedBy(p)}</TableCell>

                              <TableCell className="text-right space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelected(p)}
                                >
                                  View
                                </Button>

                                {p.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => handleMarkPaid(p.job?._id, p._id)}
                                  >
                                    {busy ? "..." : "Mark Paid"}
                                  </Button>
                                )}

                                {p.status === "PAID" && !insurance && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={busy}
                                    onClick={() => openRefund(p)}
                                  >
                                    {busy ? "..." : "Refund"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Work Request / Trip Details</DialogTitle>
              </DialogHeader>

              {selected && (
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2 rounded-md border p-3">
                    <div>
                      <strong>Job ID:</strong> {selected.job?._id || "—"}
                    </div>
                    <div>
                      <strong>Role Needed:</strong> {selected.job?.roleNeeded || "—"}
                    </div>
                    <div>
                      <strong>Job Status:</strong> {selected.job?.status || "—"}
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-md border p-3">
                    <div>
                      <strong>Customer:</strong> {selected.customer?.name || "—"}{" "}
                      <span className="text-muted-foreground">
                        ({selected.customer?.email || "—"})
                      </span>
                    </div>
                    <div>
                      <strong>Provider:</strong> {selected.provider || "—"}
                    </div>
                    <div>
                      <strong>Provider Ref:</strong> {selected.providerReference || "—"}
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-md border p-3">
                    <div>
                      <strong>Payment Status:</strong> {selected.status || "—"}
                    </div>
                    <div>
                      <strong>Amount:</strong>{" "}
                      {Number(selected.amount || 0).toLocaleString()}{" "}
                      {selected.currency || currency}
                    </div>
                    <div>
                      <strong>Created:</strong> {fmtDateTime(selected.createdAt)}
                    </div>
                    <div>
                      <strong>Refund Reason:</strong>{" "}
                      {selected.refundReason && String(selected.refundReason).trim()
                        ? selected.refundReason
                        : "—"}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={refundOpen}
            onOpenChange={(v) => {
              setRefundOpen(v);
              if (!v) {
                setRefundTarget(null);
                setRefundReason("");
              }
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Refund Payment</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="font-semibold">
                    {refundTarget?.customer?.name || "Customer"} •{" "}
                    {Number(refundTarget?.amount || 0).toLocaleString()}{" "}
                    {refundTarget?.currency || currency}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Payment ID: {refundTarget?._id || "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Refund reason (required)
                  </div>
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Example: Customer cancelled, duplicate charge, etc."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRefundOpen(false);
                      setRefundTarget(null);
                      setRefundReason("");
                    }}
                    disabled={actionLoadingId === refundTarget?._id}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={confirmRefund}
                    disabled={actionLoadingId === refundTarget?._id}
                  >
                    {actionLoadingId === refundTarget?._id ? "Refunding..." : "Confirm Refund"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {view === "PROVIDERS" ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Provider Owed Summary</CardTitle>
              <div className="text-sm text-muted-foreground">
                Filter by date range and optionally by Provider/Driver ID.
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorProviders ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorProviders}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">From</div>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">To</div>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    Provider/Driver ID (optional)
                  </div>
                  <Input
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    placeholder="paste providerId"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={runProviderOwedCompute} disabled={loadingProviders}>
                    {loadingProviders ? "Computing..." : "Compute"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProviderResult(null);
                      setErrorProviders(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {!providerResult ? (
                <div className="text-sm text-muted-foreground">Run compute to see results.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">
                        Providers ({providerResult.providers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <b>Total due (all providers):</b>{" "}
                        {Number(providerResult.totalDueAll || 0).toLocaleString()} {currency}
                      </div>

                      <div className="max-h-[420px] overflow-auto rounded-md border">
                        {providerResult.providers.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            No providers found for this filter.
                          </div>
                        ) : (
                          providerResult.providers.map((p) => (
                            <div key={p.providerId} className="border-b p-3 last:border-b-0">
                              <div className="text-sm font-semibold">
                                {p.providerName || "Unknown Provider"}{" "}
                                <span className="text-xs text-muted-foreground">
                                  • {p.providerId}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Jobs: <b>{p.jobCount}</b> • Total due:{" "}
                                <b>{Number(p.totalDue || 0).toLocaleString()}</b> {currency}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">
                        Jobs ({providerResult.rows.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[520px] overflow-auto rounded-md border">
                        {providerResult.rows.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            No jobs found for this filter.
                          </div>
                        ) : (
                          providerResult.rows.map((r) => (
                            <div key={r.jobId} className="border-b p-3 last:border-b-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold">
                                  Job {String(r.jobId).slice(-8).toUpperCase()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                                </div>
                              </div>

                              <div className="mt-2 text-xs">
                                <b>Provider:</b> {r.providerName || "-"}{" "}
                                {r.providerId ? (
                                  <span className="text-muted-foreground">• {r.providerId}</span>
                                ) : null}
                              </div>

                              <div className="mt-1 text-xs">
                                <b>Pickup:</b> {r.pickup || "-"}
                              </div>
                              <div className="mt-1 text-xs">
                                <b>Dropoff:</b> {r.dropoff || "-"}
                              </div>

                              <div className="mt-2 text-xs">
                                <b>Provider due:</b>{" "}
                                {Number(r.providerAmountDue || 0).toLocaleString()} {currency}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}