import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { FerryForm } from "@/components/admin/ferry/FerryForm";

export default function NewFerryPage() {
  return (
    <PermissionGate permission="ferry.create">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Ferries", href: "/admin/ferries" },
            { label: "New ferry" },
          ]}
        />
        <FerryForm mode={{ kind: "create" }} />
      </div>
    </PermissionGate>
  );
}
