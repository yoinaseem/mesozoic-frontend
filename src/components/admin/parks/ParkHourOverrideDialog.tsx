"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { HoursCascadeDialog } from "@/components/admin/parks/HoursCascadeDialog";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
  asHoursCascadeConflict,
  type HoursCascadeResponse,
} from "@/lib/api/park-cascade";
import {
  createParkHourOverride,
  updateParkHourOverride,
  type ParkHourOverrideInput,
} from "@/lib/api/park-hour-overrides";
import type { ParkHourOverride } from "@/types/booking";

export type ParkHourOverrideDialogMode =
  | { kind: "create" }
  | { kind: "edit"; override: ParkHourOverride };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkId: number;
  mode: ParkHourOverrideDialogMode;
  onSuccess: () => void;
};

function toTimeInput(value: string | null): string {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function ParkHourOverrideDialog({
  open,
  onOpenChange,
  parkId,
  mode,
  onSuccess,
}: Props) {
  const isEdit = mode.kind === "edit";

  const [date, setDate] = useState("");
  const [closed, setClosed] = useState(false);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<HoursCascadeResponse | null>(null);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    if (!open) return;
    reset();
    if (mode.kind === "edit") {
      const o = mode.override;
      setDate(o.date);
      setClosed(o.is_closed);
      setOpenTime(toTimeInput(o.open_time));
      setCloseTime(toTimeInput(o.close_time));
      setNote(o.note ?? "");
    } else {
      setDate("");
      setClosed(false);
      setOpenTime("");
      setCloseTime("");
      setNote("");
    }
  }, [open, mode, reset]);

  // Per API §9: both null = closed; both set = explicit hours; partial = 422.
  // Toggling "Closed" wipes the times so we never accidentally submit a
  // partial. DESD-95 hybrid cascade is plumbed via the `on_conflict` param.
  const submit = async (onConflict: "reject" | "cascade") => {
    const payload: ParkHourOverrideInput = {
      date,
      open_time: closed ? null : toApiTime(openTime),
      close_time: closed ? null : toApiTime(closeTime),
      note: note.trim() === "" ? null : note,
      on_conflict: onConflict,
    };
    if (mode.kind === "create") {
      await createParkHourOverride(parkId, payload);
    } else {
      await updateParkHourOverride(parkId, mode.override.id, payload);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      await submit("reject");
      toast.success(mode.kind === "create" ? "Override created." : "Override updated.");
      onSuccess();
    } catch (error) {
      const cascade = asHoursCascadeConflict(error);
      if (cascade) {
        setConflict(cascade);
      } else {
        setFromApiError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCascadeConfirm = async () => {
    setSubmitting(true);
    try {
      await submit("cascade");
      toast.success(
        mode.kind === "create"
          ? "Override created (with cascade)."
          : "Override updated (with cascade).",
      );
      setConflict(null);
      onSuccess();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const timesIncomplete =
    !closed && (openTime === "" || closeTime === "" || openTime === closeTime);
  const submitDisabled = submitting || date === "" || timesIncomplete;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit override" : "New override"}
            </DialogTitle>
          </DialogHeader>

          <FormField label="Date" name="date" errors={fieldErrors} required>
            <DatePicker
              value={date}
              onChange={setDate}
              disabled={isEdit}
            />
          </FormField>

          <FormField label="Closed" name="is_closed" errors={fieldErrors}>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={closed}
                onCheckedChange={(value) => {
                  const next = value === true;
                  setClosed(next);
                  if (next) {
                    // Clearing prevents accidentally submitting a partial pair.
                    setOpenTime("");
                    setCloseTime("");
                  }
                }}
              />
              <span>Closed for the day (overrides any baseline hours)</span>
            </label>
          </FormField>

          {!closed ? (
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
          ) : null}

          {!closed &&
          openTime !== "" &&
          closeTime !== "" &&
          openTime === closeTime ? (
            <p className="text-sm text-destructive">
              Close time must differ from open time.
            </p>
          ) : null}

          <FormField label="Note" name="note" errors={fieldErrors}>
            <Input
              type="text"
              maxLength={255}
              placeholder="e.g. Closed for holiday"
              value={note}
              onChange={(event) => setNote(event.target.value)}
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
              {isEdit ? "Save" : "Create override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <HoursCascadeDialog
        open={conflict !== null}
        onOpenChange={(next) => {
          if (!next) setConflict(null);
        }}
        conflict={conflict}
        onConfirm={handleCascadeConfirm}
      />
    </Dialog>
  );
}
