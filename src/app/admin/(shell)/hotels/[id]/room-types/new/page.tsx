"use client";

import { use } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { RoomTypeForm } from "@/components/admin/hotels/RoomTypeForm";

export default function NewRoomTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hotelId = Number(id);

  if (Number.isNaN(hotelId)) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid hotel id.
      </p>
    );
  }

  return (
    <PermissionGate permission="room-types.create">
      <RoomTypeForm hotelId={hotelId} mode={{ kind: "create" }} />
    </PermissionGate>
  );
}
