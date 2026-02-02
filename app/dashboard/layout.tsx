"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import DashboardShell from "@/components/layout/dashboard-shell";
import CountrySwitcher from "@/components/country/country-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>
  {children}
</DashboardShell>
    </AuthGuard>
  );
}