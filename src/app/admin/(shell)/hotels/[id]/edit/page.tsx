"use client";

import { use, useEffect, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { HotelForm } from "@/components/admin/hotels/HotelForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getHotel } from "@/lib/api/hotels";
import type { Hotel } from "@/types/booking";

export default function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hotelId = Number(id);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Number.isNaN(hotelId)) {
      setError("Invalid hotel id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getHotel(hotelId)
      .then((res) => {
        if (!cancelled) setHotel(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load hotel.");
        } else {
          setError("Failed to load hotel.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

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

  if (!hotel) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Hotel not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="hotels.update">
      <HotelForm mode={{ kind: "edit", initial: hotel }} />
    </PermissionGate>
  );
}
