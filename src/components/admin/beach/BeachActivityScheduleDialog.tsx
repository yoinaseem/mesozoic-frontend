"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TimePicker } from "@/components/ui/time-picker";
import {
  createBeachActivitySchedule,
  updateBeachActivitySchedule,
  type BeachActivityScheduleInput,
} from "@/lib/api/beach-activity-schedules";
import type {
  BeachActivitySchedule,
  BeachActivityScheduleStatus,
} from "@/types/booking";

export type BeachActivityScheduleDialogMode =
  | { kind: "create" }
  | { kind: "edit"; schedule: BeachActivitySchedule };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: number;
  /** Pre-fill end_time as start_time + this duration in minutes when create. */
  defaultDurationMinutes?: number | null;
  mode: BeachActivityScheduleDialogMode;
  onSuccess: () => void;
};

type FormState = {
  activity_date: string;
  start_time: string;
  end_time: string;
  status: BeachActivityScheduleStatus;
};

function toTimeInput(value: string | null): string {
  if (!value) return "";
  // API returns H:i:s; HTML/Picker UX wants HH:mm.
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Adds N minutes to "HH:mm" without crossing into a calendar overnight wrap.
// Used only as a pre-fill convenience — the server is canonical for end_time
// (Model B), and overnight schedules (end < start) are stored verbatim.
function addMinutesToTime(time: string, minutes: number): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = (h * 60 + m + minutes) % (24 * 60);
  const safe = total < 0 ? total + 24 * 60 : total;
  const nextH = Math.floor(safe / 60);
  const nextM = safe % 60;
  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
}

function emptyState(): FormState {
  return {
    activity_date: "",
    start_time: "",
    end_time: "",
    status: "pending",
  };
}

function fromSchedule(schedule: BeachActivitySchedule): FormState {
  return {
    activity_date: schedule.activity_date,
    start_time: toTimeInput(schedule.start_time),
    end_time: toTimeInput(schedule.end_time),
    status: schedule.status,
  };
}

export function BeachActivityScheduleDialog({
  open,
  onOpenChange,
  activityId,
  defaultDurationMinutes,
  mode,
  onSuccess,
}: Props) {
  const isEdit = mode.kind === "edit";
  const [form, setForm] = useState<FormState>(() =>
    mode.kind === "edit" ? fromSchedule(mode.schedule) : emptyState(),
  );
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    if (open) {
      setForm(mode.kind === "edit" ? fromSchedule(mode.schedule) : emptyState());
      reset();
    }
  }, [open, mode, reset]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartChange = (next: string) => {
    // Only auto-fill end_time on create when the operator hasn't touched it yet.
    // Once they've picked an end manually, leave it alone.
    setForm((prev) => {
      if (
        mode.kind === "create" &&
        prev.end_time === "" &&
        defaultDurationMinutes != null &&
        defaultDurationMinutes > 0 &&
        next !== ""
      ) {
        return {
          ...prev,
          start_time: next,
          end_time: addMinutesToTime(next, defaultDurationMinutes),
        };
      }
      return { ...prev, start_time: next };
    });
  };

  const buildPayload = (): BeachActivityScheduleInput => ({
    activity_date: form.activity_date,
    start_time: toApiTime(form.start_time),
    end_time: toApiTime(form.end_time),
    status: form.status,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        await createBeachActivitySchedule(activityId, buildPayload());
        toast.success("Schedule created.");
      } else {
        await updateBeachActivitySchedule(
          activityId,
          mode.schedule.id,
          buildPayload(),
        );
        toast.success("Schedule updated.");
      }
      onSuccess();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const sameStartEnd =
    form.start_time !== "" &&
    form.end_time !== "" &&
    form.start_time === form.end_time;

  const submitDisabled =
    submitting ||
    form.activity_date === "" ||
    form.start_time === "" ||
    form.end_time === "" ||
    sameStartEnd;

  // DESD-97: schedule create rejects past dates. On edit the date can be
  // moved but only to today/future; status-only updates on past schedules
  // remain allowed when the date field is omitted, so we still constrain
  // both modes to today+ on the picker side.
  const minDate = todayIso();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit schedule" : "New schedule"}
            </DialogTitle>
          </DialogHeader>

          <FormField
            label="Date"
            name="activity_date"
            errors={fieldErrors}
            required
          >
            <DatePicker
              value={form.activity_date}
              onChange={(next) => setField("activity_date", next)}
              min={minDate}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Start time"
              name="start_time"
              errors={fieldErrors}
              required
            >
              <TimePicker
                value={form.start_time}
                onChange={handleStartChange}
              />
            </FormField>

            <FormField
              label="End time"
              name="end_time"
              errors={fieldErrors}
              required
              helper="Overnight (end before start) is stored verbatim."
            >
              <TimePicker
                value={form.end_time}
                onChange={(next) => setField("end_time", next)}
              />
            </FormField>
          </div>

          {sameStartEnd ? (
            <p className="text-sm text-destructive">
              End time must differ from start time.
            </p>
          ) : null}

          <FormField label="Status" name="status" errors={fieldErrors}>
            <Select
              value={form.status}
              onValueChange={(next) =>
                setField("status", next as BeachActivityScheduleStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {submitting ? <Spinner /> : null}
              {isEdit ? "Save" : "Create schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
