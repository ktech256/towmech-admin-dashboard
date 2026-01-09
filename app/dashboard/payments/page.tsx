"use client";

import { useEffect, useMemo, useState } from "react";

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

import {
  fetchAdminPayments,
  refundPayment,
  markPaymentPaid,
} from "@/lib/api/payments";

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

  customer?: {
    name?: string;
    email?: string;
  };

  job?: {
    _id?: string;
    roleNeeded?: string;
    status?: string;
  };

  manualMarkedBy?: {
    name?: string;
    email?: string;
  };

  refundedBy?: {
    name?: string;
    email?: string;
  };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Payment | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPayments();
      setPayments(data?.payments || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

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

  const getStatusBadge = (status: string) => {
    if (status === "PAID") return <Badge className="bg-green-600">PAID</Badge>;
    if (status === "PENDING")
      return <Badge className="bg-yellow-600">PENDING</Badge>;
    if (status === "FAILED")
      return <Badge className="bg-red-600">FAILED</Badge>;
    if (status === "REFUNDED")
      return <Badge className="bg-slate-700">REFUNDED</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleRefund = async (paymentId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to mark this payment as refunded?"
    );
    if (!confirm) return;

    setActionLoadingId(paymentId);

    try {
      await refundPayment(paymentId);
      await loadPayments();
      alert("Payment refunded ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Refund failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPaid = async (jobId?: string, paymentId?: string) => {
    if (!jobId) {
      alert("Job ID missing for this payment ❌");
      return;
    }

    const confirm = window.confirm(
      "Are you sure you want to manually mark this payment as PAID?"
    );
    if (!confirm) return;

    setActionLoadingId(paymentId || jobId);

    try {
      await markPaymentPaid(jobId);
      await loadPayments();
      alert("Payment marked PAID ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Mark paid failed ❌");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Payments & Financial Controls"
        description="Track booking fees, payments, refunds, and revenue movement."
      />

      {/* ✅ Summary Cards */}
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
              {totals.totalPaid.toLocaleString()} ZAR
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

      {/* ✅ Search + Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Transactions</CardTitle>

          <Input
            className="max-w-sm"
            placeholder="Search customer, status, provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading payments...
            </div>
          )}

          {error && (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-sm text-muted-foreground"
                      >
                        No payments found ✅
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">
                          {p.customer?.name || "—"}
                          <div className="text-xs text-muted-foreground">
                            {p.customer?.email || ""}
                          </div>
                        </TableCell>

                        <TableCell>
                          {p.amount?.toLocaleString()} {p.currency || "ZAR"}
                        </TableCell>

                        <TableCell>{getStatusBadge(p.status)}</TableCell>

                        <TableCell>{p.provider || "—"}</TableCell>

                        <TableCell>
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>

                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(p)}
                          >
                            View
                          </Button>

                          {/* ✅ Mark Paid only when pending */}
                          {p.status === "PENDING" && (
                            <Button
                              size="sm"
                              disabled={actionLoadingId === p._id}
                              onClick={() =>
                                handleMarkPaid(p.job?._id, p._id)
                              }
                            >
                              {actionLoadingId === p._id ? "..." : "Mark Paid"}
                            </Button>
                          )}

                          {/* ✅ Refund only when paid */}
                          {p.status === "PAID" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={actionLoadingId === p._id}
                              onClick={() => handleRefund(p._id)}
                            >
                              {actionLoadingId === p._id ? "..." : "Refund"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Payment Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <strong>Status:</strong> {selected.status}
              </div>

              <div>
                <strong>Amount:</strong>{" "}
                {selected.amount?.toLocaleString()} {selected.currency}
              </div>

              <div>
                <strong>Customer:</strong> {selected.customer?.name} (
                {selected.customer?.email})
              </div>

              <div>
                <strong>Provider:</strong> {selected.provider || "—"}
              </div>

              <div>
                <strong>Reference:</strong> {selected.providerReference || "—"}
              </div>

              <div>
                <strong>Paid At:</strong>{" "}
                {selected.paidAt
                  ? new Date(selected.paidAt).toLocaleString()
                  : "—"}
              </div>

              <div>
                <strong>Manual Marked By:</strong>{" "}
                {selected.manualMarkedBy?.name
                  ? `${selected.manualMarkedBy.name} (${selected.manualMarkedBy.email})`
                  : "—"}
              </div>

              <div>
                <strong>Refunded By:</strong>{" "}
                {selected.refundedBy?.name
                  ? `${selected.refundedBy.name} (${selected.refundedBy.email})`
                  : "—"}
              </div>

              <div>
                <strong>Refunded At:</strong>{" "}
                {selected.refundedAt
                  ? new Date(selected.refundedAt).toLocaleString()
                  : "—"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
