"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRoundIcon, PlusIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { listUsers } from "@/lib/api/users";
import type { AuthUser, Paginated } from "@/types/auth";

// Mirrors backend `App\Support\SystemRoles::NAMES`. Used to mark a role chip
// with the "system" pill so operators know it's protected from rename/delete.
const SYSTEM_ROLES = new Set([
  "superadmin",
  "hotel-manager",
  "ferry-manager",
  "park-manager",
  "beach-manager",
  "customer",
]);

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function RoleChip({ name }: { name: string }) {
  const isSystem = SYSTEM_ROLES.has(name);
  return (
    <span
      className={
        isSystem
          ? "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
          : "inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
      }
    >
      {name}
      {isSystem ? (
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          system
        </span>
      ) : null}
    </span>
  );
}

export function AdminUsersList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<AuthUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    listUsers(page)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load users.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state = loading
    ? "loading"
    : error
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const columns: DataTableColumn<AuthUser>[] = [
    {
      key: "name",
      header: "Name",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (user) =>
        user.roles.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((r) => (
              <RoleChip key={r} name={r} />
            ))}
          </div>
        ),
    },
    {
      key: "extras",
      header: "Access",
      cell: (user) => {
        const direct = user.direct_permissions?.length ?? 0;
        const hotels = user.managed_hotel_ids?.length ?? 0;
        if (direct === 0 && hotels === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {direct > 0 ? (
              <StatusBadge variant="warning">+{direct} direct</StatusBadge>
            ) : null}
            {hotels > 0 ? (
              <StatusBadge variant="success">
                {hotels} hotel{hotels === 1 ? "" : "s"}
              </StatusBadge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      cell: (user) => formatDate(user.created_at),
      headClassName: "w-[8rem]",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (user) => {
        const items: RowActionItem[] = [
          {
            label: "Edit access",
            icon: KeyRoundIcon,
            onSelect: () => router.push(`/admin/users/${user.id}/access`),
          },
        ];
        return <RowActions items={items} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage staff accounts: roles, direct permission grants, and hotel-manager assignments."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/users/new">
              <PlusIcon />
              New user
            </Link>
          </Button>
        }
      />

      <DataTable<AuthUser>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(user) => user.id}
        errorMessage={error}
        onRowClick={(user) => router.push(`/admin/users/${user.id}/access`)}
        emptyState={
          <EmptyState
            title="No users yet"
            description="Staff accounts will appear here once created."
          />
        }
        pagination={
          meta && meta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={meta.current_page >= meta.last_page || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
