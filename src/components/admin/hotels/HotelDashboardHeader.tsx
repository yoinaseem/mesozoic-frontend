"use client";

import Image from "next/image";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { Hotel } from "@/types/booking";

type HotelDashboardHeaderProps = {
  hotel: Hotel;
  onEdit: () => void;
  onDelete: () => void;
};

export function HotelDashboardHeader({
  hotel,
  onEdit,
  onDelete,
}: HotelDashboardHeaderProps) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("hotels.update");
  const canDelete = hasPermission("hotels.delete");

  return (
    <div className="flex flex-col gap-4">
      {hotel.image ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl border">
          <Image
            src={hotel.image}
            alt={hotel.name}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{hotel.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hotel.address ?? "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <PencilIcon />
              Edit hotel
            </Button>
          ) : null}
          {canDelete ? (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {hotel.description ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          {hotel.description}
        </p>
      ) : null}

      {hotel.amenities && hotel.amenities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {hotel.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {amenity}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
