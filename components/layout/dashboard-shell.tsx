// components/layout/dashboard-shell.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  BarChart3,
  Map,
  Users,
  Truck,
  Briefcase,
  CreditCard,
  DollarSign,
  Tags,
  Globe,
  Settings,
  LifeBuoy,
  Shield,
  Bell,
  MessageCircle,
  UserCog,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
};

export default function DashboardShell({ children, headerRight }: Props) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },

    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Live Map", href: "/dashboard/live-map", icon: Map },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Providers", href: "/dashboard/providers", icon: Truck },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },

    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Pricing", href: "/dashboard/pricing", icon: DollarSign },
    { name: "Service Categories", href: "/dashboard/service-categories", icon: Tags },

    { name: "Zones", href: "/dashboard/zones", icon: Map },

    { name: "Support", href: "/dashboard/support", icon: LifeBuoy },

    { name: "Chats", href: "/dashboard/chats", icon: MessageCircle },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Safety & Security", href: "/dashboard/safety", icon: Shield },
    { name: "Roles & Permissions", href: "/dashboard/roles", icon: UserCog },

    { name: "System Settings", href: "/dashboard/settings", icon: Settings },

    { name: "Countries", href: "/dashboard/countries", icon: Globe },
    { name: "Country Services", href: "/dashboard/country-services", icon: Globe },
    { name: "Payment Routing", href: "/dashboard/payment-routing", icon: CreditCard },
    { name: "Legal", href: "/dashboard/legal", icon: Globe },
    { name: "Insurance", href: "/dashboard/insurance", icon: Globe },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white px-4 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">TowMech Admin</h1>
          <p className="text-sm text-gray-500">Dashboard</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
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
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Top header bar */}
        <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="text-sm text-gray-500">Dashboard</div>
            <div className="flex items-center gap-3">{headerRight}</div>
          </div>
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}