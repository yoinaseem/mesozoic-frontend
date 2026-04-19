import { PermissionGate } from "@/components/auth/permission-gate";
import { AdminUsersList } from "@/components/auth/AdminUsersList";

export default function AdminUsersPage() {
  return (
    <PermissionGate role="superadmin">
      <AdminUsersList />
    </PermissionGate>
  );
}
