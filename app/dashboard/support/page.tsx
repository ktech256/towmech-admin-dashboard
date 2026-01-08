import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Support & Disputes"
        description="Resolve customer issues, disputes, and escalation queues."
      />
      <SummaryCards />
      <TablePlaceholder title="Open support tickets" />
    </div>
  );
}
