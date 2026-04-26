"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { listParkActivitySchedules } from "@/lib/api/theme-parks";
import { cascadeDeleteParkActivitySchedule } from "@/lib/api/park-cascade-delete";
import type {
  ParkActivity,
  ParkActivitySchedule,
  ParkActivityScheduleStatus,
} from "@/types/booking";

import {
  ParkActivityScheduleDialog,
  type ParkActivityScheduleDialogMode,
} from "./ParkActivityScheduleDialog";

type PanelProps = {
  parkId: number;
  activity: ParkActivity;
  showIds?: boolean;
  tick: number;
  onChanged: () => void;
};

function scheduleBadge(status: ParkActivityScheduleStatus) {
  switch (status) {
    case "scheduled":
      return <StatusBadge variant="success">Scheduled</StatusBadge>;
    case "cancelled":
      return <StatusBadge variant="destructive">Cancelled</StatusBadge>;
    case "completed":
      return <StatusBadge variant="muted">Completed</StatusBadge>;
  }
}

function formatTime(time: string | null): string {
  if (!time) return "—";
  // Expect H:i:s from API; trim seconds for display.
  const [h, m] = time.split(":");
  if (!h || !m) return time;
  return `${h}:${m}`;
}

export function ParkActivitySchedulesPanel({
  parkId,
  activity,
  showIds = false,
  tick,
  onChanged,
}: PanelProps) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("park.create");
  const canUpdate = hasPermission("park.update");
  const canDelete = hasPermission("park.delete");

  const [schedules, setSchedules] = useState<ParkActivitySchedule[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [dialogMode, setDialogMode] =
    useState<ParkActivityScheduleDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<ParkActivitySchedule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listParkActivitySchedules(parkId, activity.id);
      setSchedules(res.data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load schedules.");
      } else {
        setLoadError("Failed to load schedules.");
      }
      setSchedules(null);
    } finally {
      setLoading(false);
    }
  }, [parkId, activity.id]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      // Cascade-delete: cancel every confirmed booking on this schedule,
      // then delete the schedule itself. One operator prompt up front.
      const summary = await cascadeDeleteParkActivitySchedule(
        parkId,
        activity.id,
        pendingDelete.id,
      );
      const parts = ["Schedule deleted"];
      if (summary.bookings_cancelled > 0) {
        parts.push(`${summary.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      await load();
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  const handleDialogSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged();
  };

  // DESD-95: all-day activities don't take manually-authored schedules — the
  // booking flow lazily materializes a per-date schedule on first booking
  // whose window mirrors that date's effective hours. Hide the New-schedule
  // affordance and surface why.
  const isAllDay = activity.is_all_day;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {activity.name} Schedules
        </p>
        {canCreate && !isAllDay ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogMode({ kind: "create" })}
          >
            <PlusIcon />
            New schedule
          </Button>
        ) : null}
      </div>

      {isAllDay ? (
        <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          This is an all-day activity. Schedules are created automatically when
          a customer books a date — their window mirrors that day&apos;s
          effective park hours.
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-5" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : !schedules || schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isAllDay
            ? "No bookings yet — schedules will appear here once customers book this activity."
            : `No schedules for this activity yet.${
                canCreate ? " Use “New schedule” to add one." : ""
              }`}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                {showIds ? <th className="w-20 px-3 py-2">ID</th> : null}
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  {showIds ? (
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {schedule.id}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 font-medium">{schedule.date}</td>
                  <td className="px-3 py-2">
                    {formatTime(schedule.start_time)}
                  </td>
                  <td className="px-3 py-2">
                    {formatTime(schedule.end_time)}
                  </td>
                  <td className="px-3 py-2">{scheduleBadge(schedule.status)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDialogMode({
                              kind: "edit",
                              schedule,
                            })
                          }
                          aria-label={`Edit schedule ${schedule.id}`}
                        >
                          <PencilIcon />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPendingDelete(schedule)}
                          aria-label={`Delete schedule ${schedule.id}`}
                        >
                          <Trash2Icon />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ParkActivityScheduleDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        parkId={parkId}
        activityId={activity.id}
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
            ? `Are you sure you want to delete this activity schedule (${pendingDelete.date} · ${formatTime(pendingDelete.start_time)})?`
            : "Are you sure you want to delete this activity schedule?"
        }
        description="All bookings made for this schedule will also be deleted. Please confirm before making this destructive action!"
        confirmLabel="Delete schedule & bookings"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
