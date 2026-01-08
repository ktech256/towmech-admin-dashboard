import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pricing & Commission Controls"
        description="Adjust pricing tiers, surge rules, and commission structures."
      />
      <SummaryCards />
      <TablePlaceholder title="Pricing adjustments" />
    </div>
  );
}
