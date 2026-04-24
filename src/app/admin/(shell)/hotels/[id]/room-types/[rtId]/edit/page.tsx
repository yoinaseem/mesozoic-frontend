"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { RoomTypeForm } from "@/components/admin/hotels/RoomTypeForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getHotel } from "@/lib/api/hotels";
import type { Hotel, RoomType } from "@/types/booking";

export default function EditRoomTypePage({
  params,
}: {
  params: Promise<{ id: string; rtId: string }>;
}) {
  const { id, rtId } = use(params);
  const hotelId = Number(id);
  const roomTypeId = Number(rtId);
  const invalidUrl = Number.isNaN(hotelId) || Number.isNaN(roomTypeId);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(!invalidUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidUrl) return;
    let cancelled = false;

    getHotel(hotelId)
      .then((res) => {
        if (cancelled) return;
        const rt = res.data.room_types?.find((r) => r.id === roomTypeId);
        if (!rt) {
          setError("Room type not found.");
          setLoading(false);
          return;
        }
        setHotel(res.data);
        setRoomType(rt);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load room type.");
        } else {
          setError("Failed to load room type.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId, roomTypeId, invalidUrl]);

  if (invalidUrl) {
    return (
      <p className="py-20 text-center text-sm text-destructive">Invalid URL.</p>
    );
  }

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

  if (!hotel || !roomType) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Room type not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="room-types.update">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Hotels", href: "/admin/hotels" },
            { label: hotel.name, href: `/admin/hotels/${hotelId}` },
            { label: roomType.name },
            { label: "Edit" },
          ]}
        />
        <RoomTypeForm
          hotelId={hotelId}
          mode={{ kind: "edit", initial: roomType }}
        />
      </div>
    </PermissionGate>
  );
}
