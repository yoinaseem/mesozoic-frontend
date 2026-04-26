"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LayersIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import { deleteFerryType, listFerryTypes } from "@/lib/api/ferry-types";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerryType,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import type { Paginated } from "@/types/auth";
import type { FerryType } from "@/types/booking";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function FerryTypesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canDelete = hasPermission("ferry.delete");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<FerryType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingDelete, setPendingDelete] = useState<FerryType | null>(null);
  // Cascade conflict state — set after the routine archive prompt comes back
  // with a 409. The cascade dialog renders the count and offers a retry.
  const [cascadeTarget, setCascadeTarget] = useState<{
    type: FerryType;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listFerryTypes(nextPage);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load ferry types.");
      } else {
        setErrorMessage("Failed to load ferry types.");
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

  const columns: DataTableColumn<FerryType>[] = [
    {
      key: "name",
      header: "Name",
      cell: (type) => <span className="font-medium">{type.name}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (type) => type.capacity,
      className: "w-24",
    },
    {
      key: "price",
      header: "Price / seat",
      cell: (type) => formatPrice(type.price),
      className: "w-32",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (type) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "ferry.update",
            onSelect: () => router.push(`/admin/ferry-types/${type.id}/edit`),
          },
          {
            label: "Archive",
            icon: Trash2Icon,
            permission: "ferry.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(type),
          },
        ];
        return (
          <div className="flex items-center justify-end gap-2">
            <RowActions items={items} />
          </div>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState
      icon={LayersIcon}
      title="No ferry types yet"
      description={
        canCreate
          ? "Create the first ferry type — vessels are added underneath."
          : "Ferry types will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href="/admin/ferry-types/new">
              <PlusIcon />
              New ferry type
            </Link>
          </Button>
        ) : null
      }
    />
  );

  // Routine archive flow:
  //  - Default DELETE; success closes the prompt and reloads.
  //  - On 409 {blocking_bookings}, switch to the cascade prompt with the count.
  //  - On other errors, toast and re-throw so ConfirmDialog stays open.
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerryType(pendingDelete.id);
      toast.success(`Archived ${pendingDelete.name}.`);
      await load(page);
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ type: pendingDelete, conflict: blocking });
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
      const outcome = await cascadeArchiveFerryType(cascadeTarget.type.id);
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = [`Archived ${cascadeTarget.type.name}`];
      if (counts.ferries_archived) {
        parts.push(`${counts.ferries_archived} ferry(ies) archived`);
      }
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
          { label: "Ferry types" },
        ]}
      />
      <PageHeader
        title="Ferry types"
        description="Catalogue of vessel classes — price and capacity live here."
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/ferry-types/new">
                <PlusIcon />
                New ferry type
              </Link>
            </Button>
          ) : null
        }
      />

      <DataTable<FerryType>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(type) => type.id}
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
            ? `Archive ferry type ${pendingDelete.name}?`
            : "Archive ferry type?"
        }
        description="Archives the type and every vessel + slot under it. If any confirmed bookings exist you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={confirmDelete}
      />

      <FerryArchiveConfirm
        open={cascadeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeTarget(null);
        }}
        resourceLabel={
          cascadeTarget
            ? `ferry type ${cascadeTarget.type.name}`
            : "ferry type"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </div>
  );
}
