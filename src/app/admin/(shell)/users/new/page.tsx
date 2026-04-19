import { PermissionGate } from "@/components/auth/permission-gate";
import { CreateAdminUserForm } from "@/components/auth/CreateAdminUserForm";

export default function NewAdminUserPage() {
  return (
    <PermissionGate role="superadmin">
      <div>
        <h1 className="text-2xl font-semibold">Create admin user</h1>
        <p className="text-sm text-muted-foreground">
          Create a staff account. Role assignment happens separately once the
          backend exposes it.
        </p>
      </div>

      <div className="max-w-xl">
        <CreateAdminUserForm />
      </div>
    </PermissionGate>
  );
}
