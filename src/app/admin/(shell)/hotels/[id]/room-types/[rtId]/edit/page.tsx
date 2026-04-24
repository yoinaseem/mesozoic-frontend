"use client";

import { use, useEffect, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { RoomTypeForm } from "@/components/admin/hotels/RoomTypeForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getRoomType } from "@/lib/api/room-types";
import type { RoomType } from "@/types/booking";

export default function EditRoomTypePage({
  params,
}: {
  params: Promise<{ id: string; rtId: string }>;
}) {
  const { id, rtId } = use(params);
  const hotelId = Number(id);
  const roomTypeId = Number(rtId);

  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Number.isNaN(hotelId) || Number.isNaN(roomTypeId)) {
      setError("Invalid URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getRoomType(hotelId, roomTypeId)
      .then((res) => {
        if (!cancelled) setRoomType(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load room type.");
        } else {
          setError("Failed to load room type.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId, roomTypeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center text-sm text-destructive">{error}</p>
    );
  }

  if (!roomType) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Room type not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="room-types.update">
      <RoomTypeForm
        hotelId={hotelId}
        mode={{ kind: "edit", initial: roomType }}
      />
    </PermissionGate>
  );
}
