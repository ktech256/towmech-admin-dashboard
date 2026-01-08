import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Notifications & Messaging"
        description="Manage campaigns, alerts, and user communications."
      />
      <SummaryCards />
      <TablePlaceholder title="Scheduled notifications" />
    </div>
  );
}
