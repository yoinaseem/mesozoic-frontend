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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  updateParkActivityBooking,
  type ParkActivityBookingUpdateInput,
} from "@/lib/api/park-activity-bookings";
import type {
  ParkActivityBooking,
  ParkActivityBookingStatus,
} from "@/types/booking";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ParkActivityBooking | null;
  onSuccess: () => void;
};

export function ParkActivityBookingEditDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<ParkActivityBookingStatus>("confirmed");
  const [guests, setGuests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    if (open && booking) {
      setStatus(booking.status);
      setGuests(String(booking.guests));
      reset();
    }
  }, [open, booking, reset]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking) return;
    reset();
    setSubmitting(true);

    // Build a diff so we only send changed fields — avoids no-op writes
    // and keeps the server's status-transition guards tight.
    const diff: ParkActivityBookingUpdateInput = {};
    if (status !== booking.status) diff.status = status;
    const nextGuests = Number(guests);
    if (!Number.isNaN(nextGuests) && nextGuests !== booking.guests) {
      diff.guests = nextGuests;
    }

    if (Object.keys(diff).length === 0) {
      setSubmitting(false);
      onOpenChange(false);
      return;
    }

    try {
      await updateParkActivityBooking(booking.id, diff);
      toast.success(`Updated booking #${booking.id}.`);
      onSuccess();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !booking;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {booking ? `Edit booking #${booking.id}` : "Edit booking"}
            </DialogTitle>
          </DialogHeader>

          <FormField label="Status" name="status" errors={fieldErrors}>
            <Select
              value={status}
              onValueChange={(next) =>
                setStatus(next as ParkActivityBookingStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Guests"
            name="guests"
            errors={fieldErrors}
            helper="Changes re-run seat-pool, day-pass, and capacity checks."
          >
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
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
            <Button type="submit" disabled={disabled}>
              {submitting ? <Spinner /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
