import { PermissionGate } from "@/components/auth/permission-gate";
import { CreateAdminUserForm } from "@/components/auth/CreateAdminUserForm";

export default function NewAdminUserPage() {
  return (
    <PermissionGate role="superadmin">
      <CreateAdminUserForm />
    </PermissionGate>
  );
}
