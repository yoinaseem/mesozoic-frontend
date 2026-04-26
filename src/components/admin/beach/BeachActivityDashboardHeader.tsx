"use client";

import Image from "next/image";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { BeachActivity } from "@/types/booking";

type Props = {
  activity: BeachActivity;
  onEdit: () => void;
  onDelete: () => void;
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function BeachActivityDashboardHeader({
  activity,
  onEdit,
  onDelete,
}: Props) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("beach.update");
  const canDelete = hasPermission("beach.delete");

  return (
    <div className="flex flex-col gap-4">
      {activity.image ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl border">
          <Image
            src={activity.image}
            alt={activity.name}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{activity.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPrice(activity.price)} per guest · capacity{" "}
            {activity.capacity}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <PencilIcon />
              Edit activity
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

      {activity.description ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          {activity.description}
        </p>
      ) : null}
    </div>
  );
}
