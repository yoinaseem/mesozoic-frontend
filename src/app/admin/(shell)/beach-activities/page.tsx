"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon, UmbrellaIcon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError, toastApiError } from "@/lib/api-client";
import { listBeachActivities } from "@/lib/api/beach-activities";
import { cascadeDeleteBeachActivity } from "@/lib/api/beach-cascade-delete";
import type { Paginated } from "@/types/auth";
import type { BeachActivity } from "@/types/booking";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  return `${mins}m`;
}

export default function BeachActivitiesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("beach.create");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<BeachActivity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingDelete, setPendingDelete] = useState<BeachActivity | null>(
    null,
  );

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listBeachActivities(nextPage);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load activities.");
      } else {
        setErrorMessage("Failed to load activities.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state = loading
    ? "loading"
    : errorMessage
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const columns: DataTableColumn<BeachActivity>[] = [
    {
      key: "name",
      header: "Name",
      cell: (activity) => (
        <span className="font-medium group-hover:underline">
          {activity.name}
        </span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (activity) => activity.capacity,
      className: "w-24",
    },
    {
      key: "duration",
      header: "Duration",
      cell: (activity) => formatDuration(activity.duration),
      className: "w-28",
    },
    {
      key: "price",
      header: "Price / guest",
      cell: (activity) => formatPrice(activity.price),
      className: "w-32",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (activity) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "beach.update",
            onSelect: () =>
              router.push(`/admin/beach-activities/${activity.id}/edit`),
          },
          {
            label: "Delete",
            icon: Trash2Icon,
            permission: "beach.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(activity),
          },
        ];
        return (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <RowActions items={items} />
          </div>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState
      icon={UmbrellaIcon}
      title="No beach activities yet"
      description={
        canCreate
          ? "Create the first beach activity to get things started."
          : "Activities will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href="/admin/beach-activities/new">
              <PlusIcon />
              New activity
            </Link>
          </Button>
        ) : null
      }
    />
  );

  // Cascade delete: cancel every confirmed booking on every schedule, delete
  // schedules, then delete the activity. Single confirmation up front so the
  // operator only gets one prompt — same UX as park.
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const summary = await cascadeDeleteBeachActivity(pendingDelete.id);
      const parts = [`Deleted ${pendingDelete.name}`];
      if (summary.bookings_cancelled > 0) {
        parts.push(`${summary.bookings_cancelled} booking(s) cancelled`);
      }
      if (summary.schedules_deleted > 0) {
        parts.push(`${summary.schedules_deleted} schedule(s) removed`);
      }
      toast.success(parts.join(" · "));
      const shouldStepBack = rows.length === 1 && meta && meta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load(page);
      }
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Beach activities" },
        ]}
      />
      <PageHeader
        title="Beach activities"
        description="Manage beach activity catalogue."
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/beach-activities/new">
                <PlusIcon />
                New activity
              </Link>
            </Button>
          ) : null
        }
      />

      <DataTable<BeachActivity>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(activity) => activity.id}
        onRowClick={(activity) =>
          router.push(`/admin/beach-activities/${activity.id}`)
        }
        errorMessage={errorMessage}
        emptyState={emptyState}
        pagination={
          meta && meta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total}{" "}
                total
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

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.name}?`
            : "Are you sure you want to delete this beach activity?"
        }
        description="All schedules under this activity and all bookings made for them will also be deleted. Please confirm before making this destructive action!"
        confirmLabel="Delete activity & bookings"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
