"use client";

import { useAuth } from "@/context/auth-context";

type PermissionGateProps = {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ permission, role, children, fallback }: PermissionGateProps) {
  const { hasPermission, hasRole } = useAuth();

  const allowed =
    (permission ? hasPermission(permission) : true) &&
    (role ? hasRole(role) : true);

  if (!allowed) {
    return (
      <>
        {fallback ?? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
            <h2 className="text-xl font-semibold">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
