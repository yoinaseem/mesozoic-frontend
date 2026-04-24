"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toastApiError } from "@/lib/api-client";
import { deleteRoom } from "@/lib/api/rooms";
import type { HotelAvailabilityRoom } from "@/lib/api/hotels";
import type { RoomType } from "@/types/booking";

import { RoomDialog, type RoomDialogMode } from "./RoomDialog";

type RoomTypeRoomsPanelProps = {
  hotelId: number;
  roomType: RoomType;
  rooms: HotelAvailabilityRoom[] | null;
  onChanged: () => void;
};

export function RoomTypeRoomsPanel({
  hotelId,
  roomType,
  rooms,
  onChanged,
}: RoomTypeRoomsPanelProps) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("rooms.create");
  const canUpdate = hasPermission("rooms.update");
  const canDelete = hasPermission("rooms.delete");

  const [dialogMode, setDialogMode] = useState<RoomDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<HotelAvailabilityRoom | null>(null);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRoom(hotelId, pendingDelete.room_id);
      toast.success(`Deleted room ${pendingDelete.room_no}.`);
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {roomType.name} Rooms
        </p>
        {canCreate ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogMode({ kind: "create" })}
          >
            <PlusIcon />
            New room
          </Button>
        ) : null}
      </div>

      {rooms === null ? (
        <p className="text-sm text-muted-foreground">Availability loading…</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rooms in this type yet.
          {canCreate ? " Use “New room” to add one." : ""}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2">Room Number</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.map((room) => (
                <tr key={room.room_id}>
                  <td className="px-3 py-2 font-medium">{room.room_no}</td>
                  <td className="px-3 py-2">
                    <StatusBadge variant={room.free ? "success" : "muted"}>
                      {room.free ? "Available" : "Booked"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDialogMode({
                              kind: "edit",
                              roomId: room.room_id,
                              initialRoomNo: room.room_no,
                            })
                          }
                          aria-label={`Edit room ${room.room_no}`}
                        >
                          <PencilIcon />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPendingDelete(room)}
                          aria-label={`Delete room ${room.room_no}`}
                        >
                          <Trash2Icon />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoomDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        hotelId={hotelId}
        roomTypeId={roomType.id}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={() => {
          setDialogMode(null);
          onChanged();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Delete room ${pendingDelete.room_no}?`
            : "Delete room?"
        }
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
