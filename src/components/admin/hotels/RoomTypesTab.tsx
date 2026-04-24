"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BedIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toastApiError } from "@/lib/api-client";
import { deleteRoomType } from "@/lib/api/room-types";
import type { Hotel, RoomType } from "@/types/booking";

type RoomTypesTabProps = {
  hotel: Hotel;
  availabilityByTypeId?: Map<
    number,
    { total: number; booked: number; free: number }
  > | null;
  onChanged: () => void;
};

function formatPrice(price: string | null): string {
  if (price === null || price === "") return "—";
  const n = parseFloat(price);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

export function RoomTypesTab({
  hotel,
  availabilityByTypeId,
  onChanged,
}: RoomTypesTabProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("room-types.create");
  const [pendingDelete, setPendingDelete] = useState<RoomType | null>(null);

  const roomTypes = hotel.room_types ?? [];

  const columns: DataTableColumn<RoomType>[] = [
    {
      key: "name",
      header: "Name",
      cell: (rt) => <span className="font-medium">{rt.name}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (rt) => rt.capacity ?? "—",
      headClassName: "w-[6rem]",
    },
    {
      key: "price",
      header: "Price / night",
      cell: (rt) => formatPrice(rt.price),
      headClassName: "w-[8rem]",
    },
    {
      key: "rooms",
      header: "Rooms",
      cell: (rt) =>
        availabilityByTypeId?.get(rt.id)?.total ?? rt.rooms_count ?? 0,
      headClassName: "w-[5rem]",
    },
    {
      key: "free",
      header: "Free",
      cell: (rt) => {
        const free = availabilityByTypeId?.get(rt.id)?.free;
        return free != null ? (
          free
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      headClassName: "w-[5rem]",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (rt) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "room-types.update",
            onSelect: () =>
              router.push(
                `/admin/hotels/${hotel.id}/room-types/${rt.id}/edit`,
              ),
          },
          {
            label: "Delete",
            icon: Trash2Icon,
            permission: "room-types.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(rt),
          },
        ];
        return <RowActions items={items} />;
      },
    },
  ];

  const state: "empty" | "ready" = roomTypes.length === 0 ? "empty" : "ready";

  const emptyState = (
    <EmptyState
      icon={BedIcon}
      title="No room types yet"
      description={
        canCreate
          ? "Create a room type to start managing rooms for this hotel."
          : "Room types will appear here once an administrator adds them."
      }
      action={
        canCreate ? (
          <Button asChild size="sm">
            <Link href={`/admin/hotels/${hotel.id}/room-types/new`}>
              <PlusIcon />
              New room type
            </Link>
          </Button>
        ) : null
      }
    />
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRoomType(hotel.id, pendingDelete.id);
      toast.success(`Deleted ${pendingDelete.name}.`);
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Room types</h2>
        {canCreate ? (
          <Button asChild size="sm">
            <Link href={`/admin/hotels/${hotel.id}/room-types/new`}>
              <PlusIcon />
              New room type
            </Link>
          </Button>
        ) : null}
      </div>

      <DataTable<RoomType>
        columns={columns}
        rows={roomTypes}
        state={state}
        getRowId={(rt) => rt.id}
        emptyState={emptyState}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Delete ${pendingDelete.name}?`
            : "Delete room type?"
        }
        description="This will also delete all rooms of this type. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
