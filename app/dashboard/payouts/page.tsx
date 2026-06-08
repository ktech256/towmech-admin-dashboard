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
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { countryCode } = useCountryStore();

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
        title="Weekly Payouts (Insurance)"
        description="Review and process weekly earnings for insurance jobs."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
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
                          {p.status === "PENDING" && (
                            <Button
                              size="sm"
                              disabled={actionLoadingId === p._id}
                              onClick={() => handleMarkPaid(p._id)}
                            >
                              {actionLoadingId === p._id ? "..." : "Mark Paid"}
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
    </div>
  );
}