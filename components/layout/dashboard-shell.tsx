// components/layout/dashboard-shell.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { LogOut } from "lucide-react";

import api from "@/lib/api/axios";
import { logoutAdmin } from "@/lib/api/auth";

import { ADMIN_NAV_ITEMS } from "@/config/admin-nav";

type Props = {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
};

type Permissions = Record<string, boolean>;

type MeResponse = {
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    countryCode?: string;

    // backend might return:
    // - permissions: { canX: true }
    // - permissions: ["canX", "canY"]
    // - permissions: { permissions: { canX: true } }
    permissions?: any;
  };
};

function normalizeRole(role?: string) {
  const r = String(role || "").trim();
  if (!r) return "";
  const lower = r.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "superadmin" || lower === "super-admin" || lower === "super_admin")
    return "SuperAdmin";
  return r;
}

function isAdminRole(role?: string) {
  const r = normalizeRole(role);
  return r === "Admin" || r === "SuperAdmin";
}

function normalizePermissions(input: any): Permissions {
  // Accept:
  // - { canX: true }
  // - ["canX","canY"]
  // - { permissions: { canX: true } }
  // - null/undefined
  if (!input) return {};

  // If wrapped like { permissions: {...} }
  if (typeof input === "object" && !Array.isArray(input) && input.permissions) {
    return normalizePermissions(input.permissions);
  }

  // If array of permission keys
  if (Array.isArray(input)) {
    const out: Permissions = {};
    for (const k of input) {
      const key = String(k || "").trim();
      if (key) out[key] = true;
    }
    return out;
  }

  // If object map
  if (typeof input === "object") {
    const out: Permissions = {};
    for (const [k, v] of Object.entries(input)) {
      const key = String(k || "").trim();
      if (!key) continue;
      out[key] = v === true;
    }
    return out;
  }

  return {};
}

function hasPermission(perms: Permissions, permissionKey: any) {
  // PermissionKey can be:
  // - undefined/null  => allowed
  // - "canViewOverview"
  // - ["canViewOverview","canManageUsers"] (any-of)
  if (!permissionKey) return true;

  if (Array.isArray(permissionKey)) {
    return permissionKey.some((k) => perms?.[String(k || "").trim()] === true);
  }

  const key = String(permissionKey || "").trim();
  if (!key) return true;
  return perms?.[key] === true;
}

export default function DashboardShell({ children, headerRight }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  // ✅ Load current admin (token already attached by axios interceptor)
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setMeLoading(true);
      setMeError(null);
      try {
        const res = await api.get("/auth/me"); // axios.ts prevents /api/api
        const data: MeResponse = res?.data || {};
        if (!mounted) return;

        const u = data?.user || null;
        setMe(u);

        // optional: cache for other components
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("towmech_admin_me", JSON.stringify(u || {}));
          }
        } catch {
          // ignore
        }
      } catch (err: any) {
        if (!mounted) return;

        // fallback: try cached me so sidebar doesn't become empty
        let cached: any = null;
        try {
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("towmech_admin_me");
            if (raw) cached = JSON.parse(raw);
          }
        } catch {}

        if (cached) {
          setMe(cached);
          setMeError(null);
        } else {
          setMe(null);
          setMeError(err?.response?.data?.message || "Failed to load session");
        }
      } finally {
        if (!mounted) return;
        setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, []);

  const role = normalizeRole(me?.role);
  const perms: Permissions = useMemo(() => normalizePermissions(me?.permissions), [me?.permissions]);

  // ✅ Permission filter:
  // - SuperAdmin sees everything
  // - Admin sees items only if permission passes OR item has no permissionKey
  const visibleNavItems = useMemo(() => {
    if (!isAdminRole(role)) return [];
    if (role === "SuperAdmin") return ADMIN_NAV_ITEMS;

    return ADMIN_NAV_ITEMS.filter((item: any) => hasPermission(perms, item.permissionKey));
  }, [role, perms]);

  const handleLogout = () => {
    logoutAdmin();
    // optional cleanup
    try {
      localStorage.removeItem("towmech_admin_me");
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white px-4 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">TowMech Admin</h1>
          <p className="text-sm text-gray-500">Dashboard</p>

          {/* ✅ small status */}
          <div className="mt-3 text-xs text-gray-500">
            {meLoading ? (
              <div>Loading session...</div>
            ) : me ? (
              <div>
                <div className="font-semibold text-gray-700">{me?.name || "Admin"}</div>
                <div className="opacity-80">{me?.email || ""}</div>
                <div className="opacity-80">
                  Role: <span className="font-semibold">{role || "-"}</span>
                </div>

                {/* debug (safe): shows how many permissions were detected */}
                <div className="mt-1 opacity-80">
                  Permissions: <span className="font-semibold">{Object.keys(perms || {}).filter((k) => perms[k]).length}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600">{meError || "Not logged in"}</div>
            )}
          </div>
        </div>

        <nav className="space-y-1">
          {visibleNavItems.map((item: any) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* ✅ Logout always visible */}
        <div className="mt-6 border-t pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Top header bar */}
        <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="text-sm text-gray-500">Dashboard</div>

            {/* keep your existing headerRight (CountrySwitcher, etc.) */}
            <div className="flex items-center gap-3">{headerRight}</div>
          </div>
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}