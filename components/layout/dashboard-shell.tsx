"use client";

import React from "react";

export function DashboardShell({
  children,
  headerRight,
}: {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="font-semibold">Dashboard</div>

        {/* ✅ RIGHT SLOT */}
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>

      {/* Body */}
      <div className="p-6">{children}</div>
    </div>
  );
}