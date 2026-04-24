import { PermissionGate } from "@/components/auth/permission-gate";
import { HotelForm } from "@/components/admin/hotels/HotelForm";

export default function NewHotelPage() {
  return (
    <PermissionGate permission="hotels.create">
      <HotelForm mode={{ kind: "create" }} />
    </PermissionGate>
  );
}
