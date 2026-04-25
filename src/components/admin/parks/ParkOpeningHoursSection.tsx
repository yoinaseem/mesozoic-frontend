"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import {
  deleteParkOpeningHour,
  listParkOpeningHours,
} from "@/lib/api/park-opening-hours";
import type { ParkOpeningDay, ParkOpeningHour } from "@/types/booking";

import {
  ParkOpeningHourDialog,
  type ParkOpeningHourDialogMode,
} from "./ParkOpeningHourDialog";

const DAYS: { day: ParkOpeningDay; label: string }[] = [
  { day: "monday", label: "Monday" },
  { day: "tuesday", label: "Tuesday" },
  { day: "wednesday", label: "Wednesday" },
  { day: "thursday", label: "Thursday" },
  { day: "friday", label: "Friday" },
  { day: "saturday", label: "Saturday" },
  { day: "sunday", label: "Sunday" },
];

function formatTime(value: string | null): string {
  if (!value) return "—";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

type Props = {
  parkId: number;
  tick: number;
  onChanged: () => void;
};

export function ParkOpeningHoursSection({ parkId, tick, onChanged }: Props) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("park.create");
  const canUpdate = hasPermission("park.update");
  const canDelete = hasPermission("park.delete");

  const [hours, setHours] = useState<ParkOpeningHour[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dialogMode, setDialogMode] =
    useState<ParkOpeningHourDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ParkOpeningHour | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listParkOpeningHours(parkId);
      setHours(res.data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load opening hours.");
      } else {
        setLoadError("Failed to load opening hours.");
      }
      setHours(null);
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const byDay = useMemo(() => {
    const map = new Map<ParkOpeningDay, ParkOpeningHour>();
    if (hours) {
      for (const h of hours) {
        map.set(h.day as ParkOpeningDay, h);
      }
    }
    return map;
  }, [hours]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteParkOpeningHour(parkId, pendingDelete.id);
      toast.success(`Removed hours for ${pendingDelete.day}.`);
      await load();
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  const handleSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">Weekday baseline</h2>
          <p className="text-sm text-muted-foreground">
            Default open / close times by day of the week.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-5" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead className="w-32">Open</TableHead>
                <TableHead className="w-32">Close</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map(({ day, label }) => {
                const entry = byDay.get(day);
                return (
                  <TableRow key={day}>
                    <TableCell className="font-medium capitalize">
                      {label}
                    </TableCell>
                    <TableCell>{formatTime(entry?.open_time ?? null)}</TableCell>
                    <TableCell>
                      {formatTime(entry?.close_time ?? null)}
                    </TableCell>
                    <TableCell>
                      {entry ? (
                        <StatusBadge variant="success">Configured</StatusBadge>
                      ) : (
                        <StatusBadge variant="muted">Not set</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry ? (
                          <>
                            {canUpdate ? (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  setDialogMode({
                                    kind: "edit",
                                    openingHour: entry,
                                  })
                                }
                                aria-label={`Edit hours for ${label}`}
                              >
                                <PencilIcon />
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setPendingDelete(entry)}
                                aria-label={`Remove hours for ${label}`}
                              >
                                <Trash2Icon />
                              </Button>
                            ) : null}
                          </>
                        ) : canCreate ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDialogMode({
                                kind: "create",
                                lockedDay: day,
                              })
                            }
                          >
                            <PlusIcon />
                            Set
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ParkOpeningHourDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        parkId={parkId}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Remove ${pendingDelete.day} hours?`
            : "Remove hours?"
        }
        description="The day will fall back to 'not configured' (treated as closed for booking)."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </section>
  );
}
