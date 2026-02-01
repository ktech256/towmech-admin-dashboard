"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function DashboardShell({
  children,
  headerRight,
}: {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/analytics", label: "Analytics" },
      { href: "/dashboard/live-map", label: "Live Map" },

      { href: "/dashboard/users", label: "Users" },
      { href: "/dashboard/providers", label: "Providers" },
      { href: "/dashboard/jobs", label: "Jobs" },
      { href: "/dashboard/payments", label: "Payments" },

      { href: "/dashboard/pricing", label: "Pricing" },
      { href: "/dashboard/service-categories", label: "Service Categories" },
      { href: "/dashboard/zones", label: "Zones" },
      { href: "/dashboard/support", label: "Support" },
      { href: "/dashboard/settings", label: "System Settings" },

      // ✅ Country workspace modules
      { href: "/dashboard/countries", label: "Countries" },
      { href: "/dashboard/country-services", label: "Country Services" },
      { href: "/dashboard/payment-routing", label: "Payment Routing" },
      { href: "/dashboard/legal", label: "Legal" },
      { href: "/dashboard/insurance", label: "Insurance" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* ✅ Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
          <div className="border-b px-4 py-4">
            <div className="text-sm font-semibold text-slate-900">TowMech Admin</div>
            <div className="text-xs text-slate-500">Dashboard</div>
          </div>

          <nav className="p-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname?.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center rounded-md px-3 py-2 text-sm transition",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* ✅ Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile nav hint */}
                <div className="md:hidden text-sm font-semibold text-slate-900">
                  Dashboard
                </div>
                <div className="hidden md:block text-sm font-semibold text-slate-900">
                  Dashboard
                </div>
              </div>

              {/* ✅ RIGHT SLOT */}
              <div className="flex items-center gap-2">{headerRight}</div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}