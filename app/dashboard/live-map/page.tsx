import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function LiveMapPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Live Map & Fleet Control"
        description="Monitor live driver locations, dispatch zones, and coverage health."
      />
      <SummaryCards />
      <TablePlaceholder title="Live fleet activity" />
    </div>
  );
}
