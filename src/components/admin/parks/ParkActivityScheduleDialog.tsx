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
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import {
  createParkActivitySchedule,
  updateParkActivitySchedule,
  type ParkActivityScheduleInput,
} from "@/lib/api/park-activity-schedules";
import type {
  ParkActivitySchedule,
  ParkActivityScheduleStatus,
} from "@/types/booking";

export type ParkActivityScheduleDialogMode =
  | { kind: "create" }
  | { kind: "edit"; schedule: ParkActivitySchedule };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkId: number;
  activityId: number;
  mode: ParkActivityScheduleDialogMode;
  onSuccess: () => void;
};

type FormState = {
  date: string;
  start_time: string;
  end_time: string;
  status: ParkActivityScheduleStatus;
  notes: string;
};

function toTimeInput(value: string | null): string {
  if (!value) return "";
  // API returns H:i:s — the HTML <input type=time> expects HH:mm (seconds
  // optional). Trim to five chars so the control accepts it cleanly.
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  const trimmed = value.trim();
  // API accepts H:i:s — pad to include seconds if the user didn't.
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function emptyState(): FormState {
  return {
    date: "",
    start_time: "",
    end_time: "",
    status: "scheduled",
    notes: "",
  };
}

// DESD-95: end_time is canonical and always present on read.
function fromSchedule(schedule: ParkActivitySchedule): FormState {
  return {
    date: schedule.date,
    start_time: toTimeInput(schedule.start_time),
    end_time: toTimeInput(schedule.end_time),
    status: schedule.status,
    notes: schedule.notes ?? "",
  };
}

export function ParkActivityScheduleDialog({
  open,
  onOpenChange,
  parkId,
  activityId,
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

  const buildPayload = (): ParkActivityScheduleInput => ({
    date: form.date,
    start_time: toApiTime(form.start_time),
    end_time: toApiTime(form.end_time),
    status: form.status,
    notes: form.notes.trim() === "" ? null : form.notes,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        await createParkActivitySchedule(parkId, activityId, buildPayload());
        toast.success("Schedule created.");
      } else {
        await updateParkActivitySchedule(
          parkId,
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
    form.date === "" ||
    form.start_time === "" ||
    form.end_time === "" ||
    sameStartEnd;

  // DESD-95: schedule create rejects past dates. Only constrain create — on
  // edit, status/notes tweaks on past schedules remain allowed (server only
  // blocks moving the date itself to the past).
  const minDate = mode.kind === "create" ? todayIso() : undefined;

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

          <FormField label="Date" name="date" errors={fieldErrors} required>
            <DatePicker
              value={form.date}
              onChange={(next) => setField("date", next)}
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
                onChange={(next) => setField("start_time", next)}
              />
            </FormField>

            <FormField
              label="End time"
              name="end_time"
              errors={fieldErrors}
              required
              helper="Must fit inside park hours; overnight (end before start) is OK."
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
                setField("status", next as ParkActivityScheduleStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Notes" name="notes" errors={fieldErrors}>
            <Textarea
              rows={2}
              placeholder="Optional internal notes"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
            />
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
