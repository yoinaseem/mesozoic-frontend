"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { listUsers } from "@/lib/api/users";
import type { AuthUser, Paginated } from "@/types/auth";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

const columns: DataTableColumn<AuthUser>[] = [
  {
    key: "name",
    header: "Name",
    cell: (user) => <span className="font-medium">{user.name}</span>,
  },
  { key: "email", header: "Email", cell: (user) => user.email },
  {
    key: "roles",
    header: "Roles",
    cell: (user) => user.roles.join(", ") || "—",
  },
  {
    key: "created",
    header: "Created",
    cell: (user) => formatDate(user.created_at),
  },
];

export function AdminUsersList() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<AuthUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    listUsers(page)
      .then((data) => {
        if (!cancelled) setResult(data);
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Admin users"
        description="Staff accounts with access to the management console."
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
