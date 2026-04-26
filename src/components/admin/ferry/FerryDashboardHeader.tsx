"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { Ferry } from "@/types/booking";

type Props = {
  ferry: Ferry;
  onEdit: () => void;
  onArchive: () => void;
};

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function FerryDashboardHeader({ ferry, onEdit, onArchive }: Props) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("ferry.update");
  const canDelete = hasPermission("ferry.delete");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold">{ferry.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ferry.ferry_type
              ? `${ferry.ferry_type.name} · capacity ${ferry.ferry_type.capacity} · ${formatPrice(ferry.ferry_type.price)} / seat`
              : "Type details unavailable"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <PencilIcon />
              Edit ferry
            </Button>
          ) : null}
          {canDelete ? (
            <Button size="sm" variant="destructive" onClick={onArchive}>
              <Trash2Icon />
              Archive
            </Button>
          ) : null}
        </div>
      </div>

      {ferry.ferry_type?.description ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          {ferry.ferry_type.description}
        </p>
      ) : null}
    </div>
  );
}
