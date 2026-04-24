"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRightIcon,
  HotelIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteHotel, listHotels } from "@/lib/api/hotels";
import type { Paginated } from "@/types/auth";
import type { Hotel } from "@/types/booking";

export default function HotelsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("hotels.create");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Hotel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingDelete, setPendingDelete] = useState<Hotel | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listHotels(nextPage);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load hotels.");
      } else {
        setErrorMessage("Failed to load hotels.");
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

  const columns: DataTableColumn<Hotel>[] = [
    {
      key: "name",
      header: "Name",
      cell: (hotel) => <span className="font-medium">{hotel.name}</span>,
    },
    {
      key: "address",
      header: "Address",
      cell: (hotel) => hotel.address ?? "—",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (hotel) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "hotels.update",
            onSelect: () => router.push(`/admin/hotels/${hotel.id}/edit`),
          },
          {
            label: "Delete",
            icon: Trash2Icon,
            permission: "hotels.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(hotel),
          },
        ];
        return (
          <div className="flex items-center justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/hotels/${hotel.id}`}>
                View details
                <ArrowRightIcon />
              </Link>
            </Button>
            <RowActions items={items} />
          </div>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState
      icon={HotelIcon}
      title="No hotels yet"
      description={
        canCreate
          ? "Create the first hotel to get things started."
          : "Hotels will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href="/admin/hotels/new">
              <PlusIcon />
              New hotel
            </Link>
          </Button>
        ) : null
      }
    />
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteHotel(pendingDelete.id);
      toast.success(`Deleted ${pendingDelete.name}.`);
      // If we just cleared the last row on a non-first page, step back a page.
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
      <PageHeader
        title="Hotels"
        description="Manage accommodations on the isle."
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/hotels/new">
                <PlusIcon />
                New hotel
              </Link>
            </Button>
          ) : null
        }
      />

      <DataTable<Hotel>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(hotel) => hotel.id}
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
          pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete hotel?"
        }
        description="This will also delete all room types and rooms under this hotel. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
