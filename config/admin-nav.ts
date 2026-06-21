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
  Banknote,
  Tags,
  Globe,
  Settings,
  LifeBuoy,
  Shield,
  Bell,
  MessageCircle,
  UserCog,
  FileText,
  Activity,
} from "lucide-react";

export type AdminNavItem = {
  name: string;
  href: string;
  icon: any;
  /**
   * If set:
   * - string: requires that permission to be true
   * - string[]: requires ANY of the permissions to be true
   *
   * SuperAdmin sees all.
   */
  permissionKey?: string | string[];
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  // Overview
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    permissionKey: "canViewOverview",
  },

  // Analytics
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permissionKey: "canViewAnalytics",
  },

  // Live Map
  {
    name: "Live Map",
    href: "/dashboard/live-map",
    icon: Map,
    permissionKey: "canViewLiveMap",
  },

  // Users / Providers / Jobs
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    permissionKey: "canManageUsers",
  },
  {
    name: "Providers",
    href: "/dashboard/providers",
    icon: Truck,
    permissionKey: "canVerifyProviders",
  },
  {
    name: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    permissionKey: "canManageJobs",
  },
  {
    name: "Partners",
    href: "/dashboard/partners",
    icon: Users,
    permissionKey: ["canManageUsers", "canVerifyProviders"],
  },
  {
    name: "Portal Control Center",
    href: "/dashboard/portal-control",
    icon: Activity,
    permissionKey: ["canManageSettings", "canVerifyProviders"],
  },

  // Payments / Pricing
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    permissionKey: "canApprovePayments",
  },
  {
    name: "Provider Payouts",
    href: "/dashboard/payouts",
    icon: Banknote,
    permissionKey: "canManageProviderPayouts",
  },
  {
    name: "Pricing",
    href: "/dashboard/pricing",
    icon: DollarSign,
    permissionKey: "canManagePricing",
  },
  {
    name: "Service Categories",
    href: "/dashboard/service-categories",
    icon: Tags,
    permissionKey: "canManageServiceCategories",
  },

  // Zones
  {
    name: "Zones",
    href: "/dashboard/zones",
    icon: Map,
    permissionKey: "canManageZones",
  },

  // Support
  {
    name: "Support",
    href: "/dashboard/support",
    icon: LifeBuoy,
    permissionKey: "canViewSupport",
  },

  // Chats / Notifications
  {
    name: "Chats",
    href: "/dashboard/chats",
    icon: MessageCircle,
    permissionKey: "canManageChats",
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    permissionKey: "canManageNotifications",
  },

  // Safety & Security
  {
    name: "Safety & Security",
    href: "/dashboard/safety",
    icon: Shield,
    permissionKey: "canManageSafety",
  },

  // Roles & Permissions
  {
    name: "Roles & Permissions",
    href: "/dashboard/roles",
    icon: UserCog,
    permissionKey: "canManageRoles",
  },

  // System Settings (✅ ensure route is /dashboard/settings everywhere)
  {
    name: "System Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permissionKey: "canManageSettings",
  },

  // Global/country configs
  {
    name: "Countries",
    href: "/dashboard/countries",
    icon: Globe,
    permissionKey: "canManageCountries",
  },
  {
    name: "Country Services",
    href: "/dashboard/country-services",
    icon: Globe,
    permissionKey: "canManageCountryServices",
  },
  {
    name: "Payment Routing",
    href: "/dashboard/payment-routing",
    icon: CreditCard,
    permissionKey: "canManagePaymentRouting",
  },
  {
    name: "Legal",
    href: "/dashboard/legal",
    icon: Globe,
    permissionKey: "canManageLegal",
  },
  {
    name: "Insurance",
    href: "/dashboard/insurance",
    icon: Globe,
    permissionKey: "canManageInsurance",
  },
  {
    name: "Insurance Invoices",
    href: "/dashboard/insurance-invoices",
    icon: FileText,
    permissionKey: "canManageInsuranceInvoices",
  },
];