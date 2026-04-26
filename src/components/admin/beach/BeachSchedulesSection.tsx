"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlusIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  BeachActivityScheduleDialog,
  type BeachActivityScheduleDialogMode,
} from "@/components/admin/beach/BeachActivityScheduleDialog";
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
import { listBeachActivitySchedules } from "@/lib/api/beach-activities";
import { cascadeDeleteBeachActivitySchedule } from "@/lib/api/beach-cascade-delete";
import type { Paginated } from "@/types/auth";
import type {
  BeachActivity,
  BeachActivitySchedule,
  BeachActivityScheduleStatus,
} from "@/types/booking";

function statusBadge(status: BeachActivityScheduleStatus) {
  switch (status) {
    case "confirmed":
      return <StatusBadge variant="success">Confirmed</StatusBadge>;
    case "pending":
      return <StatusBadge variant="warning">Pending</StatusBadge>;
    case "cancelled":
      return <StatusBadge variant="destructive">Cancelled</StatusBadge>;
  }
}

function formatTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

type Props = {
  activity: BeachActivity;
  /** Bumped externally when something else mutates schedules. */
  tick?: number;
  onChanged?: () => void;
};

export function BeachSchedulesSection({ activity, tick = 0, onChanged }: Props) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("beach.create");
  const canUpdate = hasPermission("beach.update");
  const canDelete = hasPermission("beach.delete");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<BeachActivitySchedule> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dialogMode, setDialogMode] =
    useState<BeachActivityScheduleDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<BeachActivitySchedule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listBeachActivitySchedules(activity.id, page);
      setResult(res);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load schedules.");
      } else {
        setLoadError("Failed to load schedules.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [activity.id, page]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const handleDialogSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged?.();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const summary = await cascadeDeleteBeachActivitySchedule(
        activity.id,
        pendingDelete.id,
      );
      const parts = ["Schedule deleted"];
      if (summary.bookings_cancelled > 0) {
        parts.push(`${summary.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      // Step back a page if we just emptied the last row of a non-first page.
      const shouldStepBack = rows.length === 1 && meta && meta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load();
      }
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
          <h2 className="text-lg font-medium">Schedules</h2>
          <p className="text-sm text-muted-foreground">
            Sessions of {activity.name} — overlap and slot uniqueness enforced
            server-side.
          </p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={() => setDialogMode({ kind: "create" })}>
            <PlusIcon />
            New schedule
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
            title="No schedules yet"
            description={
              canCreate
                ? "Create a schedule to start taking bookings."
                : "Schedules will appear here once an administrator adds them."
            }
            action={
              canCreate ? (
                <Button
                  size="sm"
                  onClick={() => setDialogMode({ kind: "create" })}
                >
                  <PlusIcon />
                  New schedule
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
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-24">Start</TableHead>
                <TableHead className="w-24">End</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((schedule) => {
                const items: RowActionItem[] = [
                  {
                    label: "Edit",
                    icon: PencilIcon,
                    permission: "beach.update",
                    onSelect: () => setDialogMode({ kind: "edit", schedule }),
                  },
                  {
                    label: "Delete",
                    icon: Trash2Icon,
                    permission: "beach.delete",
                    variant: "destructive",
                    onSelect: () => setPendingDelete(schedule),
                  },
                ];
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.activity_date}
                    </TableCell>
                    <TableCell>{formatTime(schedule.start_time)}</TableCell>
                    <TableCell>{formatTime(schedule.end_time)}</TableCell>
                    <TableCell>{statusBadge(schedule.status)}</TableCell>
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

      <BeachActivityScheduleDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        activityId={activity.id}
        defaultDurationMinutes={activity.duration}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={handleDialogSuccess}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Are you sure you want to delete this schedule (${pendingDelete.activity_date} · ${formatTime(pendingDelete.start_time)})?`
            : "Are you sure you want to delete this schedule?"
        }
        description="All bookings made for this schedule will also be deleted. Please confirm before making this destructive action!"
        confirmLabel="Delete schedule & bookings"
        onConfirm={confirmDelete}
      />
    </section>
  );
}
