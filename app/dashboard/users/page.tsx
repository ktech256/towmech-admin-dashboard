"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api/axios";

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

import { fetchUsers } from "@/lib/api/users";
import { useCountryStore } from "@/lib/store/countryStore";

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  createdAt?: string;

  accountStatus?: {
    isSuspended?: boolean;
    isBanned?: boolean;
    isArchived?: boolean;
  };

  // optional extras that might exist on your backend
  countryCode?: string;
  lastLoginAt?: string;
};

function withApiPrefix(path: string) {
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const alreadyHasApi = base.endsWith("/api") || base.includes("/api/");
  return `${alreadyHasApi ? "" : "/api"}${path.startsWith("/") ? "" : "/"}${path}`;
}

function roleNorm(r?: string) {
  return String(r || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isHiddenAdminRole(role?: string) {
  const r = roleNorm(role);
  // hide admin + superadmin + "creation admin" (and common variants)
  return (
    r === "admin" ||
    r === "superadmin" ||
    r === "creationadmin" ||
    r === "createdadmin" ||
    r === "admincreation"
  );
}

type RoleFilter = "ALL" | "CUSTOMER" | "MECHANIC" | "TOWTRUCK";

function matchesRoleFilter(u: User, roleFilter: RoleFilter) {
  if (roleFilter === "ALL") return true;
  const r = roleNorm(u.role);

  if (roleFilter === "CUSTOMER") return r === "customer";
  if (roleFilter === "MECHANIC") return r === "mechanic";
  if (roleFilter === "TOWTRUCK") return r === "towtruck";

  return true;
}

type SortMode = "LATEST" | "NAME_ASC";

function safeDateMs(d?: string) {
  const t = d ? new Date(d).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("LATEST");

  // details modal
  const [selected, setSelected] = useState<User | null>(null);
  const [selectedFull, setSelectedFull] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const { countryCode } = useCountryStore();

  const loadUsers = async () => {
    if (!countryCode) {
      setUsers([]);
      setLoading(false);
      setError("Please select a country first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchUsers();
      const list = data?.users || data?.data || data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load users. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  // Hide admin + creation admin from the page entirely
  const visibleUsers = useMemo(() => {
    return users.filter((u) => !isHiddenAdminRole(u.role));
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = visibleUsers;

    // role filter
    list = list.filter((u) => matchesRoleFilter(u, roleFilter));

    // search (name/email/phone)
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((u) => {
        return (
          (u.name || "").toLowerCase().includes(s) ||
          (u.email || "").toLowerCase().includes(s) ||
          (u.phone || "").toLowerCase().includes(s)
        );
      });
    }

    // sort
    const sorted = [...list];
    if (sortMode === "LATEST") {
      sorted.sort((a, b) => safeDateMs(b.createdAt) - safeDateMs(a.createdAt));
    } else if (sortMode === "NAME_ASC") {
      sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }

    return sorted;
  }, [visibleUsers, roleFilter, search, sortMode]);

  // Stats should reflect ONLY visible (non-admin) users on this page
  const totalUsers = visibleUsers.length;
  const verifiedUsers = visibleUsers.filter((u) => u.isVerified).length;
  const blockedUsers = visibleUsers.filter((u) => u.isBlocked).length;

  // ✅ Account actions
  const suspendUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/suspend`), { reason: "Suspended by admin" });
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Suspend failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unsuspendUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/unsuspend`), {});
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Unsuspend failed");
    } finally {
      setActionLoadingId(id);
      // small race guard: reset quickly
      setActionLoadingId(null);
    }
  };

  const banUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/ban`), { reason: "Banned by admin" });
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ban failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unbanUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/unban`), {});
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Unban failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusPill = (u: User) => {
    const st = u.accountStatus || {};
    if (st.isBanned) return <Badge className="bg-red-600 text-white">BANNED</Badge>;
    if (st.isSuspended) return <Badge className="bg-orange-600 text-white">SUSPENDED</Badge>;
    if (st.isArchived) return <Badge className="bg-slate-700 text-white">ARCHIVED</Badge>;
    return <Badge className="bg-green-600 text-white">ACTIVE</Badge>;
  };

  async function openDetails(u: User) {
    setSelected(u);
    setSelectedFull(null);
    setDetailsLoading(true);

    try {
      // Try to fetch full user details (if endpoint exists).
      // If it doesn't, we gracefully fall back to what we already have.
      const res = await api.get(withApiPrefix(`/admin/users/${u._id}`));
      setSelectedFull(res?.data || null);
    } catch (err) {
      setSelectedFull(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  const filterPillClass =
    "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="User Management"
        description="Track customer accounts, activity trends, and verification status."
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Verified Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{verifiedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Blocked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{blockedUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Users</CardTitle>

            {/* Role filter */}
            <select
              className={filterPillClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              aria-label="Filter by role"
              title="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MECHANIC">Mechanic</option>
              <option value="TOWTRUCK">TowTruck</option>
            </select>

            {/* Sort filter */}
            <select
              className={filterPillClass}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort users"
              title="Sort users"
            >
              <option value="LATEST">Latest joined</option>
              <option value="NAME_ASC">Name (A → Z)</option>
            </select>
          </div>

          <Input
            className="max-w-sm"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading users...</div>
          )}

          {error && <div className="py-10 text-center text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const st = u.accountStatus || {};
                      const busy = actionLoadingId === u._id;

                      return (
                        <TableRow key={u._id}>
                          <TableCell className="font-medium">{u.name || "—"}</TableCell>
                          <TableCell>{u.email || "—"}</TableCell>
                          <TableCell>{u.phone || "—"}</TableCell>

                          <TableCell>
                            <Badge variant="secondary">{u.role || "—"}</Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-2 items-center">
                              {u.isVerified ? (
                                <Badge variant="default">Verified</Badge>
                              ) : (
                                <Badge variant="secondary">Unverified</Badge>
                              )}

                              {u.isBlocked && <Badge className="bg-red-600 text-white">Blocked</Badge>}

                              {statusPill(u)}
                            </div>
                          </TableCell>

                          <TableCell>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            {/* ✅ View details */}
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => openDetails(u)}>
                              View Details
                            </Button>

                            {!st.isSuspended ? (
                              <Button size="sm" disabled={busy} onClick={() => suspendUser(u._id)}>
                                {busy ? "..." : "Suspend"}
                              </Button>
                            ) : (
                              <Button size="sm" variant="secondary" disabled={busy} onClick={() => unsuspendUser(u._id)}>
                                {busy ? "..." : "Unsuspend"}
                              </Button>
                            )}

                            {!st.isBanned ? (
                              <Button size="sm" variant="destructive" disabled={busy} onClick={() => banUser(u._id)}>
                                {busy ? "..." : "Ban"}
                              </Button>
                            ) : (
                              <Button size="sm" variant="secondary" disabled={busy} onClick={() => unbanUser(u._id)}>
                                {busy ? "..." : "Unban"}
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

      {/* ✅ User Detail Modal */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setSelectedFull(null);
            setDetailsLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {!selected ? null : detailsLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading user details...</div>
          ) : (
            <div className="space-y-3 text-sm">
              {/* Prefer full payload if available, otherwise fallback */}
              {(() => {
                const u = (selectedFull?.user || selectedFull || selected) as any;

                return (
                  <>
                    <div>
                      <strong>Name:</strong> {u?.name || "—"}
                    </div>
                    <div>
                      <strong>Email:</strong> {u?.email || "—"}
                    </div>
                    <div>
                      <strong>Phone:</strong> {u?.phone || "—"}
                    </div>
                    <div>
                      <strong>Role:</strong> {u?.role || "—"}
                    </div>
                    <div>
                      <strong>Country:</strong> {u?.countryCode || "—"}
                    </div>
                    <div>
                      <strong>Verified:</strong> {u?.isVerified ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Blocked:</strong> {u?.isBlocked ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {u?.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                    </div>
                    <div>
                      <strong>Last Login:</strong>{" "}
                      {u?.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                    </div>

                    {/* show account status if present */}
                    <div>
                      <strong>Account Status:</strong>{" "}
                      {u?.accountStatus
                        ? JSON.stringify(u.accountStatus)
                        : selected?.accountStatus
                        ? JSON.stringify(selected.accountStatus)
                        : "—"}
                    </div>

                    {/* show raw extra fields if backend returns more */}
                    {selectedFull ? (
                      <div className="rounded-md border bg-muted/20 p-3">
                        <div className="mb-2 font-semibold">Raw Details</div>
                        <pre className="text-xs whitespace-pre-wrap break-words">
                          {JSON.stringify(selectedFull, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}