"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  MapPinned,
  Route,
  BadgeDollarSign,
  CreditCard,
  LifeBuoy,
  Star, // ✅ added
  Bell,
  ShieldCheck,
  LineChart,
  Lock,
  Settings,
  MapPin,
  MessagesSquare, // ✅ NEW: Chats icon
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/users", icon: Users },
  { label: "Provider Management", href: "/dashboard/providers", icon: Truck },
  { label: "Trip / Job Management", href: "/dashboard/jobs", icon: Route },
  { label: "Live Map", href: "/dashboard/live-map", icon: MapPinned },
  { label: "Pricing & Commission", href: "/dashboard/pricing", icon: BadgeDollarSign },
  { label: "Payments & Finance", href: "/dashboard/payments", icon: CreditCard },
  { label: "Support & Disputes", href: "/dashboard/support", icon: LifeBuoy },

  // ✅ Ratings link
  { label: "Ratings", href: "/dashboard/support/ratings", icon: Star },

  // ✅ NEW: Chats (Admin)
  { label: "Chats", href: "/dashboard/chats", icon: MessagesSquare },

  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Safety & Security", href: "/dashboard/safety", icon: ShieldCheck },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart },
  { label: "Roles & Permissions", href: "/dashboard/roles", icon: Lock },

  // ✅ Zones
  { label: "Zones", href: "/dashboard/zones", icon: MapPin },

  { label: "System Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 border-r bg-white/95 backdrop-blur transition-transform duration-200 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div>
          <p className="text-lg font-semibold text-slate-900">TowMech Admin</p>
          <p className="text-xs text-muted-foreground">Control center</p>
        </div>
      </div>

      <nav className="flex h-[calc(100%-4rem)] flex-col gap-1 overflow-y-auto px-4 py-6">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100",
                active && "bg-slate-900 text-white hover:bg-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}