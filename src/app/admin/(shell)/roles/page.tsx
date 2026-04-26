"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, ShieldIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteRole, listRoles } from "@/lib/api/roles";
import type { Role } from "@/types/auth";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listRoles()
      .then((res) => {
        if (!cancelled) {
          setRoles(res.data);
          setError("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load roles.");
        } else {
          setError("Failed to load roles.");
        }
        setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRole(pendingDelete.id);
      toast.success(`Deleted role "${pendingDelete.name}".`);
      setReloadTick((t) => t + 1);
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  const rows = roles ?? [];
  const state = !roles
    ? "loading"
    : error
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.name}</span>
          {r.is_system ? (
            <StatusBadge variant="muted">system</StatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.permissions.length}
        </span>
      ),
      headClassName: "w-[8rem]",
    },
    {
      key: "users",
      header: "Users",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.users_count ?? 0}
        </span>
      ),
      headClassName: "w-[6rem]",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (r) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            onSelect: () => router.push(`/admin/roles/${r.id}`),
          },
        ];
        const inUse = (r.users_count ?? 0) > 0;
        if (!r.is_system) {
          items.push({
            label: inUse
              ? `Reassign ${r.users_count} user${r.users_count === 1 ? "" : "s"} first`
              : "Delete",
            icon: Trash2Icon,
            variant: "destructive",
            disabled: inUse,
            onSelect: () => setPendingDelete(r),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Roles" },
        ]}
      />

      <PageHeader
        title="Roles"
        description="Bundles of permissions assigned to users. The six system roles are protected — their names cannot be changed and they cannot be deleted."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/roles/new">
              <PlusIcon />
              New role
            </Link>
          </Button>
        }
      />

      <DataTable<Role>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(r) => r.id}
        errorMessage={error}
        onRowClick={(r) => router.push(`/admin/roles/${r.id}`)}
        emptyState={
          <EmptyState
            icon={ShieldIcon}
            title="No roles"
            description="Create a custom role to bundle permissions for a group of users."
          />
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Delete role "${pendingDelete.name}"?`
            : "Delete role?"
        }
        description="This permanently removes the role. Permissions granted to users via other roles or direct grants are unaffected."
        confirmLabel="Delete role"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
