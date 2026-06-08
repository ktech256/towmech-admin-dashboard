// Dashboard/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "🏠" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { label: "Live Map", href: "/dashboard/live-map", icon: "🗺️" },
  { label: "Users", href: "/dashboard/users", icon: "👥" },
  { label: "Providers", href: "/dashboard/providers", icon: "🚚" },
  { label: "Jobs", href: "/dashboard/jobs", icon: "🧾" },
  { label: "Payments", href: "/dashboard/payments", icon: "💳" },
  { label: "Provider Payouts", href: "/dashboard/payouts", icon: "💰" },
  { label: "Pricing", href: "/dashboard/pricing", icon: "🏷️" },
  { label: "Service Categories", href: "/dashboard/service-categories", icon: "🧰" },
  { label: "Zones", href: "/dashboard/zones", icon: "📍" },
  { label: "Support", href: "/dashboard/support", icon: "🎧" },

  { label: "Chats", href: "/dashboard/chats", icon: "💬" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "🔔" },
  { label: "Safety & Security", href: "/dashboard/safety", icon: "🛡️" },
  { label: "Roles & Permissions", href: "/dashboard/roles", icon: "🔐" },

  // ✅ fixed to match admin-nav + your settings page
  { label: "System Settings", href: "/dashboard/settings", icon: "⚙️" },

  { label: "Countries", href: "/dashboard/countries", icon: "🌍" },
  { label: "Country Services", href: "/dashboard/country-services", icon: "🧩" },
  { label: "Payment Routing", href: "/dashboard/payment-routing", icon: "🔀" },
  { label: "Legal", href: "/dashboard/legal", icon: "📜" },
  { label: "Insurance", href: "/dashboard/insurance", icon: "🧾" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] border-r bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <div className="text-lg font-semibold">TowMech Admin</div>
        <div className="text-sm text-gray-500">Dashboard</div>
      </div>

      <nav className="px-2 pb-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}