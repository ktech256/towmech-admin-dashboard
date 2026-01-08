import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Trip & Job Management"
        description="Oversee dispatched jobs, SLA adherence, and completion metrics."
      />
      <SummaryCards />
      <TablePlaceholder title="Recent job requests" />
    </div>
  );
}
