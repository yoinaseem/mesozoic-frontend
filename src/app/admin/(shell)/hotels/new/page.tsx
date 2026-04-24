import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { HotelForm } from "@/components/admin/hotels/HotelForm";

export default function NewHotelPage() {
  return (
    <PermissionGate permission="hotels.create">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Hotels", href: "/admin/hotels" },
            { label: "New hotel" },
          ]}
        />
        <HotelForm mode={{ kind: "create" }} />
      </div>
    </PermissionGate>
  );
}
