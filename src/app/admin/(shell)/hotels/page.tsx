"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HotelIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteHotel, getHotel, listHotels } from "@/lib/api/hotels";
import { listMyHotels } from "@/lib/api/room-bookings";
import type { Paginated } from "@/types/auth";
import type { Hotel } from "@/types/booking";

export default function HotelsPage() {
  const router = useRouter();
  const { hasPermission, hasRole, user, loading: authLoading } = useAuth();
  const canCreate = hasPermission("hotels.create");
  // Hotel-managers (not superadmins) get a scoped list backed by
  // /auth/me/hotels — superadmins continue to see the global paginated list.
  const isManagerOnly =
    hasRole("hotel-manager") && !hasRole("superadmin");

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Hotel[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<
    Paginated<Hotel>["meta"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [pendingDelete, setPendingDelete] = useState<Hotel | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        if (isManagerOnly) {
          const myHotels = await listMyHotels();
          if (cancelled) return;
          const scoped = myHotels.data;

          // Single-hotel manager: skip the list entirely, send them straight
          // to the dashboard for their one hotel.
          if (scoped.length === 1) {
            setRedirecting(true);
            router.replace(`/admin/hotels/${scoped[0].id}`);
            return;
          }

          // Pull the full hotel resource for each scoped hotel so the table
          // has address + the rest of the columns the superadmin view shows.
          const fullHotels = await Promise.all(
            scoped.map((h) => getHotel(h.id).then((res) => res.data)),
          );
          if (cancelled) return;
          setRows(fullHotels);
          setPaginationMeta(null);
          setErrorMessage("");
          setLoading(false);
        } else {
          const data = await listHotels(page);
          if (cancelled) return;
          setRows(data.data);
          setPaginationMeta(data.meta);
          setErrorMessage("");
          setLoading(false);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError || error instanceof Error) {
          setErrorMessage(error.message || "Failed to load hotels.");
        } else {
          setErrorMessage("Failed to load hotels.");
        }
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isManagerOnly, page, router, reloadTick]);

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
      cell: (hotel) => (
        <span className="font-medium group-hover:underline">{hotel.name}</span>
      ),
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
      icon={HotelIcon}
      title={isManagerOnly ? "No hotels assigned" : "No hotels yet"}
      description={
        isManagerOnly
          ? "Ask a superadmin to assign you to a hotel to manage."
          : canCreate
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
      const shouldStepBack =
        paginationMeta &&
        rows.length === 1 &&
        paginationMeta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        setReloadTick((t) => t + 1);
      }
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  if (redirecting) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Hotels" },
        ]}
      />
      <PageHeader
        title="Hotels"
        description={
          isManagerOnly
            ? "Hotels you manage."
            : "Manage accommodations on the isle."
        }
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
        onRowClick={(hotel) => router.push(`/admin/hotels/${hotel.id}`)}
        errorMessage={errorMessage}
        emptyState={emptyState}
        pagination={
          paginationMeta && paginationMeta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {paginationMeta.current_page} of {paginationMeta.last_page}{" "}
                · {paginationMeta.total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={paginationMeta.current_page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={
                    paginationMeta.current_page >= paginationMeta.last_page ||
                    loading
                  }
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
