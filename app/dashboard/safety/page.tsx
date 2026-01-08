import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function SafetyPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Safety & Security Controls"
        description="Monitor safety incidents, driver compliance, and platform safeguards."
      />
      <SummaryCards />
      <TablePlaceholder title="Safety incident log" />
    </div>
  );
}
