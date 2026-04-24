import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { ThemeParkForm } from "@/components/admin/parks/ThemeParkForm";

export default function NewParkPage() {
  return (
    <PermissionGate permission="park.create">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Parks", href: "/admin/parks" },
            { label: "New park" },
          ]}
        />
        <ThemeParkForm mode={{ kind: "create" }} />
      </div>
    </PermissionGate>
  );
}
