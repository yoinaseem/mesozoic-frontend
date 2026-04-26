"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarPlusIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import {
  FerryScheduleDialog,
  type FerryScheduleDialogMode,
} from "@/components/admin/ferry/FerryScheduleDialog";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
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
import { listFerrySchedules } from "@/lib/api/ferries";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerrySchedule,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import { deleteFerrySchedule } from "@/lib/api/ferry-schedules";
import type { Ferry, FerrySchedule } from "@/types/booking";

function formatTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function isOvernight(slot: FerrySchedule): boolean {
  // arrival_time < departure_time encodes an overnight crossing per §7.
  return slot.arrival_time < slot.departure_time;
}

type Props = {
  ferry: Ferry;
  tick?: number;
  onChanged?: () => void;
};

export function FerrySlotsSection({ ferry, tick = 0, onChanged }: Props) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canUpdate = hasPermission("ferry.update");
  const canDelete = hasPermission("ferry.delete");

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<FerrySchedule[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dialogMode, setDialogMode] = useState<FerryScheduleDialogMode | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<FerrySchedule | null>(
    null,
  );
  const [cascadeTarget, setCascadeTarget] = useState<{
    slot: FerrySchedule;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listFerrySchedules(ferry.id, page);
      setRows(res.data);
      setMeta(res.meta);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load slots.");
      } else {
        setLoadError("Failed to load slots.");
      }
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [ferry.id, page]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const handleDialogSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged?.();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerrySchedule(pendingDelete.id);
      toast.success("Slot archived.");
      // Step back a page if we just emptied the last row of a non-first page.
      const shouldStepBack = rows.length === 1 && meta && meta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load();
      }
      onChanged?.();
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ slot: pendingDelete, conflict: blocking });
        setPendingDelete(null);
        return;
      }
      toastApiError(error);
      throw error;
    }
  };

  const confirmCascade = async () => {
    if (!cascadeTarget) return;
    try {
      const outcome = await cascadeArchiveFerrySchedule(
        cascadeTarget.slot.id,
      );
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = ["Slot archived"];
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      await load();
      onChanged?.();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">Slots</h2>
          <p className="text-sm text-muted-foreground">
            Recurring departure windows on this vessel — customers pick a date
            at booking time.
          </p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={() => setDialogMode({ kind: "create" })}>
            <PlusIcon />
            New slot
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-5" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={CalendarPlusIcon}
            title="No slots yet"
            description={
              canCreate
                ? "Create a slot to start taking bookings on this vessel."
                : "Slots will appear here once an administrator adds them."
            }
            action={
              canCreate ? (
                <Button
                  size="sm"
                  onClick={() => setDialogMode({ kind: "create" })}
                >
                  <PlusIcon />
                  New slot
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Departure</TableHead>
                <TableHead className="w-32">Arrival</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((slot) => {
                const items: RowActionItem[] = [
                  {
                    label: "Edit",
                    icon: PencilIcon,
                    permission: "ferry.update",
                    onSelect: () =>
                      setDialogMode({ kind: "edit", schedule: slot }),
                  },
                  {
                    label: "Archive",
                    icon: Trash2Icon,
                    permission: "ferry.delete",
                    variant: "destructive",
                    onSelect: () => setPendingDelete(slot),
                  },
                ];
                return (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      {formatTime(slot.departure_time)}
                    </TableCell>
                    <TableCell>
                      <span>{formatTime(slot.arrival_time)}</span>
                      {isOvernight(slot) ? (
                        <span
                          className="ml-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title="Overnight crossing — arrives next calendar day"
                        >
                          <MoonIcon className="size-3" aria-hidden />
                          overnight
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {slot.departure_port} → {slot.arrival_port}
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate || canDelete ? (
                        <RowActions items={items} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.current_page} of {meta.last_page} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={meta.current_page >= meta.last_page || loading}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <FerryScheduleDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        ferryId={ferry.id}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={handleDialogSuccess}
      />

      <ConfirmDialog
        open={pendingDelete !== null && canDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Archive slot ${formatTime(pendingDelete.departure_time)}–${formatTime(pendingDelete.arrival_time)}?`
            : "Archive slot?"
        }
        description="If any confirmed bookings reference this slot you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={confirmDelete}
      />

      <FerryArchiveConfirm
        open={cascadeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeTarget(null);
        }}
        resourceLabel={
          cascadeTarget
            ? `slot ${formatTime(cascadeTarget.slot.departure_time)}–${formatTime(cascadeTarget.slot.arrival_time)}`
            : "slot"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </section>
  );
}
