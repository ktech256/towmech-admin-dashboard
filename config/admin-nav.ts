// config/admin-nav.ts
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

export type AdminNavItem = {
  name: string;
  href: string;
  icon: any;
  permissionKey?: string; // if set, Admin must have it; SuperAdmin sees all
};

/**
 * IMPORTANT:
 * Some backends store permissions as:
 *  - canManageUsers
 * Others store them as:
 *  - permissions: { canManageUsers: true }
 * And some use different naming for "view" vs "manage".
 *
 * So we support multiple keys (aliases) per menu item.
 */
export type PermissionKey = string | string[];

export type AdminNavItemV2 = {
  name: string;
  href: string;
  icon: any;
  permissionKey?: PermissionKey; // string OR array of strings
};

export function hasPermission(
  permissions: Record<string, boolean> | null | undefined,
  key?: PermissionKey
) {
  if (!key) return true; // public menu item
  if (!permissions) return false;

  // single key
  if (typeof key === "string") return permissions[key] === true;

  // multiple keys: allow if ANY is true
  if (Array.isArray(key)) return key.some((k) => permissions[k] === true);

  return false;
}

export const ADMIN_NAV_ITEMS: AdminNavItemV2[] = [
  // Overview
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissionKey: ["canViewOverview", "canManageOverview"],
  },

  // Analytics
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permissionKey: ["canViewAnalytics", "canManageAnalytics"],
  },

  // Live Map
  {
    name: "Live Map",
    href: "/dashboard/live-map",
    icon: Map,
    permissionKey: ["canViewLiveMap", "canManageLiveMap", "canManageZones"],
  },

  // Users / Providers / Jobs
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    permissionKey: ["canManageUsers", "canViewUsers"],
  },
  {
    name: "Providers",
    href: "/dashboard/providers",
    icon: Truck,
    permissionKey: ["canVerifyProviders", "canManageProviders", "canViewProviders"],
  },
  {
    name: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    permissionKey: ["canManageJobs", "canViewJobs"],
  },

  // Payments / Pricing
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    permissionKey: ["canApprovePayments", "canManagePayments", "canViewPayments"],
  },
  {
    name: "Pricing",
    href: "/dashboard/pricing",
    icon: DollarSign,
    permissionKey: ["canManagePricing", "canViewPricing"],
  },
  {
    name: "Service Categories",
    href: "/dashboard/service-categories",
    icon: Tags,
    permissionKey: ["canManageServiceCategories", "canViewServiceCategories"],
  },

  // Zones
  {
    name: "Zones",
    href: "/dashboard/zones",
    icon: Map,
    permissionKey: ["canManageZones", "canViewZones"],
  },

  // Support (always visible)
  { name: "Support", href: "/dashboard/support", icon: LifeBuoy },

  // Chats / Notifications
  {
    name: "Chats",
    href: "/dashboard/chats",
    icon: MessageCircle,
    permissionKey: ["canManageChats", "canViewChats"],
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    permissionKey: ["canManageNotifications", "canBroadcastNotifications", "canViewNotifications"],
  },

  // Safety & Security
  {
    name: "Safety & Security",
    href: "/dashboard/safety",
    icon: Shield,
    permissionKey: ["canManageSafety", "canViewSafety"],
  },

  // Roles & Permissions
  {
    name: "Roles & Permissions",
    href: "/dashboard/roles",
    icon: UserCog,
    permissionKey: ["canManageRoles", "canViewRoles"],
  },

  // System Settings
  {
    name: "System Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permissionKey: ["canManageSettings", "canViewSettings"],
  },

  // Global/country configs
  {
    name: "Countries",
    href: "/dashboard/countries",
    icon: Globe,
    permissionKey: ["canManageCountries", "canViewCountries"],
  },
  {
    name: "Country Services",
    href: "/dashboard/country-services",
    icon: Globe,
    permissionKey: ["canManageCountryServices", "canViewCountryServices"],
  },
  {
    name: "Payment Routing",
    href: "/dashboard/payment-routing",
    icon: CreditCard,
    permissionKey: ["canManagePaymentRouting", "canViewPaymentRouting"],
  },
  {
    name: "Legal",
    href: "/dashboard/legal",
    icon: Globe,
    permissionKey: ["canManageLegal", "canViewLegal"],
  },
  {
    name: "Insurance",
    href: "/dashboard/insurance",
    icon: Globe,
    permissionKey: ["canManageInsurance", "canViewInsurance"],
  },
];