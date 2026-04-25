"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  createParkOpeningHour,
  updateParkOpeningHour,
  type ParkOpeningHourInput,
} from "@/lib/api/park-opening-hours";
import type { ParkOpeningDay, ParkOpeningHour } from "@/types/booking";

export type ParkOpeningHourDialogMode =
  | { kind: "create"; lockedDay?: ParkOpeningDay }
  | { kind: "edit"; openingHour: ParkOpeningHour };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkId: number;
  mode: ParkOpeningHourDialogMode;
  onSuccess: () => void;
};

const DAY_OPTIONS: { value: ParkOpeningDay; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function toTimeInput(value: string | null): string {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function ParkOpeningHourDialog({
  open,
  onOpenChange,
  parkId,
  mode,
  onSuccess,
}: Props) {
  const isEdit = mode.kind === "edit";

  const [day, setDay] = useState<ParkOpeningDay>("monday");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    if (!open) return;
    reset();
    if (mode.kind === "edit") {
      setDay((mode.openingHour.day as ParkOpeningDay) ?? "monday");
      setOpenTime(toTimeInput(mode.openingHour.open_time));
      setCloseTime(toTimeInput(mode.openingHour.close_time));
    } else {
      setDay(mode.lockedDay ?? "monday");
      setOpenTime("");
      setCloseTime("");
    }
  }, [open, mode, reset]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    const payload: ParkOpeningHourInput = {
      day,
      open_time: toApiTime(openTime),
      close_time: toApiTime(closeTime),
    };

    try {
      if (mode.kind === "create") {
        await createParkOpeningHour(parkId, payload);
        toast.success(`Set hours for ${day}.`);
      } else {
        await updateParkOpeningHour(parkId, mode.openingHour.id, payload);
        toast.success(`Updated hours for ${day}.`);
      }
      onSuccess();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting || openTime === "" || closeTime === "" || openTime === closeTime;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit opening hours" : "Set opening hours"}
            </DialogTitle>
          </DialogHeader>

          <FormField label="Day" name="day" errors={fieldErrors} required>
            <Select
              value={day}
              onValueChange={(next) => setDay(next as ParkOpeningDay)}
              disabled={
                isEdit ||
                (mode.kind === "create" && mode.lockedDay !== undefined)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Open time"
              name="open_time"
              errors={fieldErrors}
              required
            >
              <TimePicker value={openTime} onChange={setOpenTime} />
            </FormField>

            <FormField
              label="Close time"
              name="close_time"
              errors={fieldErrors}
              required
            >
              <TimePicker value={closeTime} onChange={setCloseTime} />
            </FormField>
          </div>

          {openTime !== "" && closeTime !== "" && openTime === closeTime ? (
            <p className="text-sm text-destructive">
              Close time must differ from open time.
            </p>
          ) : null}

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
              {isEdit ? "Save" : "Set hours"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
