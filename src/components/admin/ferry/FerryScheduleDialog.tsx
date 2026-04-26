"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MoonIcon } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { TimePicker } from "@/components/ui/time-picker";
import {
  createFerrySchedule,
  updateFerrySchedule,
  type FerryScheduleInput,
  type FerryScheduleUpdateInput,
} from "@/lib/api/ferry-schedules";
import type { FerrySchedule } from "@/types/booking";

export type FerryScheduleDialogMode =
  | { kind: "create" }
  | { kind: "edit"; schedule: FerrySchedule };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required for create; on edit the slot stays under its parent vessel. */
  ferryId: number;
  mode: FerryScheduleDialogMode;
  onSuccess: () => void;
};

type FormState = {
  departure_time: string;
  arrival_time: string;
  departure_port: string;
  arrival_port: string;
};

function toTimeInput(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function emptyState(): FormState {
  return {
    departure_time: "",
    arrival_time: "",
    departure_port: "",
    arrival_port: "",
  };
}

function fromSchedule(schedule: FerrySchedule): FormState {
  return {
    departure_time: toTimeInput(schedule.departure_time),
    arrival_time: toTimeInput(schedule.arrival_time),
    departure_port: schedule.departure_port,
    arrival_port: schedule.arrival_port,
  };
}

// "08:30" → 510. Returns NaN for empty strings; caller short-circuits.
function minutesOfDay(value: string): number {
  if (value === "") return Number.NaN;
  const [h, m] = value.split(":");
  return Number(h) * 60 + Number(m);
}

export function FerryScheduleDialog({
  open,
  onOpenChange,
  ferryId,
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const payload: FerryScheduleInput = {
          ferry_id: ferryId,
          departure_time: toApiTime(form.departure_time),
          arrival_time: toApiTime(form.arrival_time),
          departure_port: form.departure_port,
          arrival_port: form.arrival_port,
        };
        await createFerrySchedule(payload);
        toast.success("Slot created.");
      } else {
        // PATCH excludes ferry_id (slot lives under its parent vessel) and
        // sends every field — server enforces slot-uniqueness against effective
        // values and is permissive about unchanged fields.
        const diff: FerryScheduleUpdateInput = {
          departure_time: toApiTime(form.departure_time),
          arrival_time: toApiTime(form.arrival_time),
          departure_port: form.departure_port,
          arrival_port: form.arrival_port,
        };
        await updateFerrySchedule(mode.schedule.id, diff);
        toast.success("Slot updated.");
      }
      onSuccess();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const sameTimes =
    form.departure_time !== "" &&
    form.arrival_time !== "" &&
    form.departure_time === form.arrival_time;

  // Per §7: arrival_time < departure_time encodes an overnight crossing
  // (Carbon overnight wrap on read). Surface this as a hint rather than a
  // warning — it's a valid configuration.
  const departureMin = minutesOfDay(form.departure_time);
  const arrivalMin = minutesOfDay(form.arrival_time);
  const overnight =
    Number.isFinite(departureMin) &&
    Number.isFinite(arrivalMin) &&
    arrivalMin < departureMin;

  const submitDisabled =
    submitting ||
    form.departure_time === "" ||
    form.arrival_time === "" ||
    form.departure_port.trim() === "" ||
    form.arrival_port.trim() === "" ||
    sameTimes;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit slot" : "New slot"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Departure time"
              name="departure_time"
              errors={fieldErrors}
              required
            >
              <TimePicker
                value={form.departure_time}
                onChange={(next) => setField("departure_time", next)}
              />
            </FormField>

            <FormField
              label="Arrival time"
              name="arrival_time"
              errors={fieldErrors}
              required
              helper="Set earlier than departure for an overnight crossing."
            >
              <TimePicker
                value={form.arrival_time}
                onChange={(next) => setField("arrival_time", next)}
              />
            </FormField>
          </div>

          {sameTimes ? (
            <p className="text-sm text-destructive">
              Arrival time must differ from departure time.
            </p>
          ) : overnight ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MoonIcon className="size-4" aria-hidden />
              Overnight crossing — arrives the next calendar day.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Departure port"
              name="departure_port"
              errors={fieldErrors}
              required
            >
              <Input
                type="text"
                required
                maxLength={255}
                placeholder="e.g. Mainland"
                value={form.departure_port}
                onChange={(event) =>
                  setField("departure_port", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Arrival port"
              name="arrival_port"
              errors={fieldErrors}
              required
            >
              <Input
                type="text"
                required
                maxLength={255}
                placeholder="e.g. Isla Nublar"
                value={form.arrival_port}
                onChange={(event) =>
                  setField("arrival_port", event.target.value)
                }
              />
            </FormField>
          </div>

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
              {isEdit ? "Save" : "Create slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
