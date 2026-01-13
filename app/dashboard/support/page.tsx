"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { fetchAdminTickets, assignTicket, updateTicket } from "@/lib/api/support";

type Ticket = {
  _id: string;
  subject: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;

  createdBy?: {
    name?: string;
    email?: string;
    role?: string;
  };

  assignedTo?: {
    name?: string;
    email?: string;
    role?: string;
  };

  adminNote?: string;

  auditLogs?: {
    action: string;
    timestamp: string;
    meta?: any;
    by?: any;
  }[];
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Ticket | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const loadTickets = async () => {
    setLoading(true);

    try {
      const data = await fetchAdminTickets({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      });

      setTickets(data?.tickets || []);
    } catch (err) {
      alert("Failed to load support tickets ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, typeFilter, priorityFilter]);

  const filteredTickets = useMemo(() => {
    if (!search) return tickets;
    const s = search.toLowerCase();
    return tickets.filter((t) => {
      return (
        t.subject.toLowerCase().includes(s) ||
        (t.createdBy?.name || "").toLowerCase().includes(s) ||
        (t.createdBy?.email || "").toLowerCase().includes(s) ||
        (t.type || "").toLowerCase().includes(s)
      );
    });
  }, [tickets, search]);

  const getStatusBadge = (status: string) => {
    if (status === "OPEN") return <Badge className="bg-yellow-600">OPEN</Badge>;
    if (status === "IN_PROGRESS")
      return <Badge className="bg-blue-600">IN PROGRESS</Badge>;
    if (status === "RESOLVED")
      return <Badge className="bg-green-600">RESOLVED</Badge>;
    if (status === "CLOSED") return <Badge className="bg-slate-700">CLOSED</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "LOW") return <Badge variant="outline">LOW</Badge>;
    if (priority === "MEDIUM") return <Badge className="bg-slate-500">MEDIUM</Badge>;
    if (priority === "HIGH") return <Badge className="bg-orange-600">HIGH</Badge>;
    if (priority === "URGENT") return <Badge className="bg-red-600">URGENT</Badge>;
    return <Badge variant="secondary">{priority}</Badge>;
  };

  const handleAssignToMe = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    try {
      await assignTicket(ticketId);
      await loadTickets();
      alert("Ticket assigned ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Assign failed ❌");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    setActionLoadingId(ticketId);
    try {
      await updateTicket(ticketId, { status });
      await loadTickets();
      alert("Ticket updated ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Update failed ❌");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Support & Disputes"
        description="View and manage customer & provider support tickets."
      />

      {/* ✅ Filters */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Support Inbox</CardTitle>

          <div className="flex flex-wrap gap-2">
            <Input
              className="w-64"
              placeholder="Search subject, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="DRIVER">DRIVER</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="JOB">JOB</option>
              <option value="SAFETY">SAFETY</option>
              <option value="LOST_ITEM">LOST_ITEM</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading tickets...
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        No tickets found ✅
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>
                          {t.createdBy?.name || "—"}
                          <div className="text-xs text-muted-foreground">
                            {t.createdBy?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.type}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                        <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelected(t)}>
                            View
                          </Button>

                          {t.status === "OPEN" && (
                            <Button
                              size="sm"
                              disabled={actionLoadingId === t._id}
                              onClick={() => handleAssignToMe(t._id)}
                            >
                              {actionLoadingId === t._id ? "..." : "Assign"}
                            </Button>
                          )}

                          {t.status !== "RESOLVED" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={actionLoadingId === t._id}
                              onClick={() => handleStatusUpdate(t._id, "RESOLVED")}
                            >
                              {actionLoadingId === t._id ? "..." : "Resolve"}
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

      {/* ✅ Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <strong>Subject:</strong> {selected.subject}
              </div>
              <div>
                <strong>Message:</strong>
                <div className="mt-2 rounded-md border bg-slate-50 p-3">
                  {selected.message}
                </div>
              </div>
              <div>
                <strong>Status:</strong> {selected.status}
              </div>
              <div>
                <strong>Type:</strong> {selected.type}
              </div>
              <div>
                <strong>Priority:</strong> {selected.priority}
              </div>
              <div>
                <strong>Customer:</strong> {selected.createdBy?.name} ({selected.createdBy?.email})
              </div>
              <div>
                <strong>Assigned To:</strong>{" "}
                {selected.assignedTo?.name
                  ? `${selected.assignedTo.name} (${selected.assignedTo.email})`
                  : "Not assigned"}
              </div>

              {/* ✅ Audit Logs */}
              <div>
                <strong>Audit Logs:</strong>
                <div className="mt-2 space-y-2 rounded-md border bg-slate-50 p-3">
                  {selected.auditLogs?.length ? (
                    selected.auditLogs.map((log, i) => (
                      <div key={i} className="text-xs text-slate-600">
                        ✅ {log.action} — {new Date(log.timestamp).toLocaleString()}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No logs yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
