import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Analytics & Reporting"
        description="Analyze demand, supply, revenue, and operational trends."
      />
      <SummaryCards />
      <TablePlaceholder title="Analytics snapshots" />
    </div>
  );
}
