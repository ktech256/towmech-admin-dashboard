import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="User Management"
        description="Track customer accounts, activity trends, and verification status."
      />
      <SummaryCards />
      <TablePlaceholder title="User activity feed" />
    </div>
  );
}
