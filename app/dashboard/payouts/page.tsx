"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCountryStore } from "@/lib/store/countryStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Payout = {
  _id: string;
  provider?: {
    name: string;
    email: string;
    phone: string;
  };
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID";
  weekStartDate: string;
  weekEndDate: string;
  processedAt: string;
  jobs?: Array<{
    amount: number;
    completedAt: string;
    job?: {
      _id: string;
      title: string;
      status: string;
      customer?: { name: string };
    };
  }>;
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  const { countryCode } = useCountryStore();

  // ✅ Business Rule: Payouts only on Tuesday 08:00 - 16:00
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  useEffect(() => {
    const checkWindow = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      setIsWindowOpen(day === 2 && hour >= 8 && hour < 16);
    };
    checkWindow();
    const timer = setInterval(checkWindow, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/payouts/admin?countryCode=${countryCode}`);
      setPayouts(res.data.payouts || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countryCode) loadPayouts();
  }, [countryCode]);

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Are you sure you want to mark this payout as PAID? This will notify the provider.")) return;
    setActionLoadingId(id);
    try {
      await api.patch(`/api/payouts/admin/${id}/pay`);
      await loadPayouts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Provider Payouts & Invoicing"
        description="Manage provider earnings, process weekly payouts, and track SMS/Email notifications for insurance jobs."
      />

      {!isWindowOpen && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-sm text-yellow-800 dark:text-yellow-500">
              <span className="text-xl">⚠️</span>
              <p>
                <strong>Payment Window Closed:</strong> Payouts can only be processed on <strong>Tuesdays</strong> between <strong>08:00 AM and 04:00 PM</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Payout Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No payouts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell>
                          <div className="font-medium">{p.provider?.name}</div>
                          <div className="text-xs text-muted-foreground">{p.provider?.email}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(p.weekStartDate).toLocaleDateString()} - {new Date(p.weekEndDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-bold">
                          {p.currency} {p.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={p.status === "PAID" ? "bg-green-600" : "bg-yellow-600"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPayout(p)}
                            >
                              Details
                            </Button>
                            {p.status === "PENDING" && (
                              <Button
                                size="sm"
                                disabled={actionLoadingId === p._id || !isWindowOpen}
                                onClick={() => handleMarkPaid(p._id)}
                                variant={isWindowOpen ? "default" : "secondary"}
                              >
                                {actionLoadingId === p._id ? "..." : "Mark Paid"}
                              </Button>
                            )}
                          </div>
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

      <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Weekly Trip Breakdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 text-sm">
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <p className="font-bold">{selectedPayout?.provider?.name}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Period:</span>
                <p className="font-bold">
                  {selectedPayout && new Date(selectedPayout.weekStartDate).toLocaleDateString()} - {selectedPayout && new Date(selectedPayout.weekEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPayout?.jobs?.map((j, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-mono">{j.job?._id}</TableCell>
                      <TableCell className="text-xs">{j.job?.customer?.name || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(j.completedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {selectedPayout.currency} {j.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold dark:bg-slate-900">
                    <TableCell colSpan={3} className="text-right">
                      Weekly Total:
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {selectedPayout?.currency} {selectedPayout?.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                Print Statement
              </Button>
              <Button variant="outline" onClick={() => setSelectedPayout(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}