import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="TowMech Operations Overview"
        description="Monitor live fleet activity, dispatch performance, and platform health in one view."
      />
      <SummaryCards />
      <TablePlaceholder title="Latest activity across the platform" />
    </div>
  );
}
