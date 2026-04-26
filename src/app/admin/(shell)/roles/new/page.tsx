"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { RoleForm } from "@/components/admin/roles/RoleForm";

export default function NewRolePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Roles", href: "/admin/roles" },
          { label: "New" },
        ]}
      />
      <RoleForm mode={{ kind: "create" }} />
    </div>
  );
}
