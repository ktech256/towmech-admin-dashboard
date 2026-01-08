"use client";

import { useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen((open) => !open)} />
        <main className="px-4 pb-10 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
