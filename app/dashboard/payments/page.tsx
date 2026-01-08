import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Payments & Financial Controls"
        description="Track payouts, settlements, and revenue health in real time."
      />
      <SummaryCards />
      <TablePlaceholder title="Recent payment activity" />
    </div>
  );
}
