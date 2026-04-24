"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import {
  BedIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { toastApiError } from "@/lib/api-client";
import type { HotelAvailabilityRoom } from "@/lib/api/hotels";
import { deleteRoomType } from "@/lib/api/room-types";
import { cn } from "@/lib/utils";
import type { Hotel, RoomType } from "@/types/booking";

import { RoomTypeRoomsPanel } from "./RoomTypeRoomsPanel";

export type RoomTypeAvailability = {
  total: number;
  booked: number;
  free: number;
  rooms: HotelAvailabilityRoom[];
};

type RoomTypesSectionProps = {
  hotel: Hotel;
  availabilityByTypeId?: Map<number, RoomTypeAvailability> | null;
  onChanged: () => void;
};

function formatPrice(price: string | null): string {
  if (!price) return "—";
  const n = parseFloat(price);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

const COLUMN_COUNT = 7;

export function RoomTypesSection({
  hotel,
  availabilityByTypeId,
  onChanged,
}: RoomTypesSectionProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("room-types.create");
  const [pendingDelete, setPendingDelete] = useState<RoomType | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const roomTypes = hotel.room_types ?? [];

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRoomType(hotel.id, pendingDelete.id);
      toast.success(`Deleted ${pendingDelete.name}.`);
      setExpanded((prev) => {
        if (!prev.has(pendingDelete.id)) return prev;
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
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

      {roomTypes.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={BedIcon}
            title="No room types yet"
            description={
              canCreate
                ? "Create a room type to start managing rooms."
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
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead className="w-[6rem]">Capacity</TableHead>
                <TableHead className="w-[8rem]">Price / night</TableHead>
                <TableHead className="w-[5rem]">Rooms</TableHead>
                <TableHead className="w-[5rem]">Free</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((rt) => {
                const info = availabilityByTypeId?.get(rt.id);
                const isExpanded = expanded.has(rt.id);
                const rowActions: RowActionItem[] = [
                  {
                    label: "Edit type",
                    icon: PencilIcon,
                    permission: "room-types.update",
                    onSelect: () =>
                      router.push(
                        `/admin/hotels/${hotel.id}/room-types/${rt.id}/edit`,
                      ),
                  },
                  {
                    label: "Delete type",
                    icon: Trash2Icon,
                    permission: "room-types.delete",
                    variant: "destructive",
                    onSelect: () => setPendingDelete(rt),
                  },
                ];

                return (
                  <Fragment key={rt.id}>
                    <TableRow
                      onClick={() => toggleExpand(rt.id)}
                      className="cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <TableCell>
                        <ChevronRightIcon
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90",
                          )}
                          aria-hidden
                        />
                      </TableCell>
                      <TableCell className="font-medium">{rt.name}</TableCell>
                      <TableCell>{rt.capacity ?? "—"}</TableCell>
                      <TableCell>{formatPrice(rt.price)}</TableCell>
                      <TableCell>
                        {info?.total ?? rt.rooms_count ?? 0}
                      </TableCell>
                      <TableCell>
                        {info?.free != null ? (
                          info.free
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <RowActions items={rowActions} />
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={COLUMN_COUNT} className="p-0">
                          <RoomTypeRoomsPanel
                            hotelId={hotel.id}
                            roomType={rt}
                            rooms={info?.rooms ?? null}
                            onChanged={onChanged}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete room type?"
        }
        description="This will also delete all rooms of this type. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
