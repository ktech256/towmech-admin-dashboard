import { ModuleHeader } from "@/components/dashboard/module-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TablePlaceholder } from "@/components/dashboard/table-placeholder";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Admin Roles & Permissions"
        description="Manage admin access levels, permissions, and audit trail."
      />
      <SummaryCards />
      <TablePlaceholder title="Role assignments" />
    </div>
  );
}
