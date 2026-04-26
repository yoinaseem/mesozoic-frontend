import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { BeachActivityForm } from "@/components/admin/beach/BeachActivityForm";

export default function NewBeachActivityPage() {
  return (
    <PermissionGate permission="beach.create">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Beach activities", href: "/admin/beach-activities" },
            { label: "New activity" },
          ]}
        />
        <BeachActivityForm mode={{ kind: "create" }} />
      </div>
    </PermissionGate>
  );
}
