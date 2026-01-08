import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="System Settings & Platform Controls"
        description="Configure platform-wide settings and operational thresholds."
      />
      <SummaryCards />
      <TablePlaceholder title="Platform configuration" />
    </div>
  );
}
