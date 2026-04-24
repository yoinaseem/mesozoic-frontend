"use client";

import Image from "next/image";
import { MailIcon, PencilIcon, PhoneIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { ThemePark } from "@/types/booking";

type ParkDashboardHeaderProps = {
  park: ThemePark;
  onEdit: () => void;
  onDelete: () => void;
};

export function ParkDashboardHeader({
  park,
  onEdit,
  onDelete,
}: ParkDashboardHeaderProps) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("park.update");
  const canDelete = hasPermission("park.delete");

  const coverImage = park.images?.[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {coverImage ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl border">
          <Image
            src={coverImage}
            alt={park.name}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{park.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {park.contact_email ? (
              <span className="flex items-center gap-1.5">
                <MailIcon className="size-4" aria-hidden />
                {park.contact_email}
              </span>
            ) : null}
            {park.contact_phone ? (
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="size-4" aria-hidden />
                {park.contact_phone}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <PencilIcon />
              Edit park
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

      {park.description ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          {park.description}
        </p>
      ) : null}
    </div>
  );
}
