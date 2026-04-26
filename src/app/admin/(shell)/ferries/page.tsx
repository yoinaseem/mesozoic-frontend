"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, ShipIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteFerry, listFerries } from "@/lib/api/ferries";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerry,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import type { Paginated } from "@/types/auth";
import type { Ferry } from "@/types/booking";

export default function FerriesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canDelete = hasPermission("ferry.delete");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Ferry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingDelete, setPendingDelete] = useState<Ferry | null>(null);
  const [cascadeTarget, setCascadeTarget] = useState<{
    ferry: Ferry;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listFerries(nextPage);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load ferries.");
      } else {
        setErrorMessage("Failed to load ferries.");
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

  const columns: DataTableColumn<Ferry>[] = [
    {
      key: "name",
      header: "Name",
      cell: (ferry) => (
        <span className="font-medium group-hover:underline">{ferry.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (ferry) => ferry.ferry_type?.name ?? "—",
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (ferry) => ferry.ferry_type?.capacity ?? "—",
      className: "w-24",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (ferry) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "ferry.update",
            onSelect: () => router.push(`/admin/ferries/${ferry.id}/edit`),
          },
          {
            label: "Archive",
            icon: Trash2Icon,
            permission: "ferry.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(ferry),
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
      icon={ShipIcon}
      title="No ferries yet"
      description={
        canCreate
          ? "Add a vessel under an existing ferry type."
          : "Ferries will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href="/admin/ferries/new">
              <PlusIcon />
              New ferry
            </Link>
          </Button>
        ) : null
      }
    />
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerry(pendingDelete.id);
      toast.success(`Archived ${pendingDelete.name}.`);
      const shouldStepBack = rows.length === 1 && meta && meta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load(page);
      }
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ ferry: pendingDelete, conflict: blocking });
        setPendingDelete(null);
        return;
      }
      toastApiError(error);
      throw error;
    }
  };

  const confirmCascade = async () => {
    if (!cascadeTarget) return;
    try {
      const outcome = await cascadeArchiveFerry(cascadeTarget.ferry.id);
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = [`Archived ${cascadeTarget.ferry.name}`];
      if (counts.slots_archived) {
        parts.push(`${counts.slots_archived} slot(s) archived`);
      }
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      await load(page);
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
          { label: "Ferries" },
        ]}
      />
      <PageHeader
        title="Ferries"
        description="Vessels under each ferry type."
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/ferries/new">
                <PlusIcon />
                New ferry
              </Link>
            </Button>
          ) : null
        }
      />

      <DataTable<Ferry>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(ferry) => ferry.id}
        onRowClick={(ferry) => router.push(`/admin/ferries/${ferry.id}`)}
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
        open={pendingDelete !== null && canDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Archive ferry ${pendingDelete.name}?`
            : "Archive ferry?"
        }
        description="Archives the vessel and every slot under it. If any confirmed bookings exist you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={confirmDelete}
      />

      <FerryArchiveConfirm
        open={cascadeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeTarget(null);
        }}
        resourceLabel={
          cascadeTarget ? `ferry ${cascadeTarget.ferry.name}` : "ferry"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </div>
  );
}
