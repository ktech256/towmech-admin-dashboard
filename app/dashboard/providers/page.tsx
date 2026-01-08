import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Driver & Provider Management"
        description="Manage tow operators, onboarding, and fleet availability."
      />
      <SummaryCards />
      <TablePlaceholder title="Provider performance overview" />
    </div>
  );
}
