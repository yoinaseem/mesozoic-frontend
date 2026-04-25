"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, TreePalm, Trash2Icon } from "lucide-react";
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
import { asBlockingBookings } from "@/lib/api/park-cascade";
import { deleteThemePark, listThemeParks } from "@/lib/api/theme-parks";
import type { ThemePark } from "@/types/booking";

function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function ParksPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("park.create");

  const [parks, setParks] = useState<ThemePark[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [pendingDelete, setPendingDelete] = useState<ThemePark | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listThemeParks();
      setParks(data.data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load parks.");
      } else {
        setErrorMessage("Failed to load parks.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const state = loading
    ? "loading"
    : errorMessage
      ? "error"
      : parks.length === 0
        ? "empty"
        : "ready";

  const columns: DataTableColumn<ThemePark>[] = [
    {
      key: "name",
      header: "Name",
      cell: (park) => (
        <span className="font-medium group-hover:underline">{park.name}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (park) => park.capacity ?? "—",
      className: "w-[8rem]",
    },
    {
      key: "price",
      header: "Price / guest",
      cell: (park) => formatPrice(park.price),
      className: "w-[10rem]",
    },
    {
      key: "contact",
      header: "Contact",
      cell: (park) => park.contact_email ?? "—",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (park) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "park.update",
            onSelect: () => router.push(`/admin/parks/${park.id}/edit`),
          },
          {
            label: "Delete",
            icon: Trash2Icon,
            permission: "park.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(park),
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
      icon={TreePalm}
      title="No parks yet"
      description={
        canCreate
          ? "Create the first theme park to get things started."
          : "Parks will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href="/admin/parks/new">
              <PlusIcon />
              New park
            </Link>
          </Button>
        ) : null
      }
    />
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteThemePark(pendingDelete.id);
      toast.success(`Archived ${pendingDelete.name}.`);
      await load();
    } catch (error) {
      const blocking = asBlockingBookings(error);
      if (blocking) {
        toast.error(
          `Cannot archive — ${blocking.blocking_bookings} upcoming booking(s) reference this park. Cancel them first.`,
        );
        throw error;
      }
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Parks" },
        ]}
      />
      <PageHeader
        title="Parks"
        description="Manage theme parks on the isle."
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/parks/new">
                <PlusIcon />
                New park
              </Link>
            </Button>
          ) : null
        }
      />

      <DataTable<ThemePark>
        columns={columns}
        rows={parks}
        state={state}
        getRowId={(park) => park.id}
        onRowClick={(park) => router.push(`/admin/parks/${park.id}`)}
        errorMessage={errorMessage}
        emptyState={emptyState}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete park?"
        }
        description="This will also delete all activities and schedules under this park. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
