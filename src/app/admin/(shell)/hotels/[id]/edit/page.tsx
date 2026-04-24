"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
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
  const invalidHotelId = Number.isNaN(hotelId);

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(!invalidHotelId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidHotelId) return;
    let cancelled = false;

    getHotel(hotelId)
      .then((res) => {
        if (cancelled) return;
        setHotel(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load hotel.");
        } else {
          setError("Failed to load hotel.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId, invalidHotelId]);

  if (invalidHotelId) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid hotel id.
      </p>
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

  if (!hotel) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Hotel not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="hotels.update">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Hotels", href: "/admin/hotels" },
            { label: hotel.name, href: `/admin/hotels/${hotel.id}` },
            { label: "Edit" },
          ]}
        />
        <HotelForm mode={{ kind: "edit", initial: hotel }} />
      </div>
    </PermissionGate>
  );
}
