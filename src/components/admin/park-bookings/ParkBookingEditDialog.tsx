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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { asBlockingBookings } from "@/lib/api/park-cascade";
import {
  updateParkBooking,
  type ParkBookingUpdateInput,
} from "@/lib/api/park-bookings";
import type { ParkBooking, ParkBookingStatus } from "@/types/booking";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ParkBooking | null;
  onSuccess: () => void;
};

export function ParkBookingEditDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<ParkBookingStatus>("confirmed");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    if (open && booking) {
      setStatus(booking.status);
      setDate(booking.date);
      setGuests(String(booking.guests));
      reset();
    }
  }, [open, booking, reset]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking) return;
    reset();
    setSubmitting(true);

    // Diff-only payload — keeps server's date/guests re-validation tight and
    // avoids no-op writes.
    const diff: ParkBookingUpdateInput = {};
    if (status !== booking.status) diff.status = status;
    if (date !== booking.date) diff.date = date;
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
      await updateParkBooking(booking.id, diff);
      toast.success(`Updated booking #${booking.id}.`);
      onSuccess();
    } catch (error) {
      // DESD-95: cancel/date-change is blocked when the same reservation has
      // confirmed activity bookings on this day. Surface the count so the
      // operator knows where to go next.
      const blocking = asBlockingBookings(error);
      if (blocking) {
        toast.error(
          `Cannot apply — ${blocking.blocking_bookings} activity booking(s) on this date depend on this day-pass. Cancel them first via Activity bookings.`,
        );
      } else {
        setFromApiError(error);
      }
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
              onValueChange={(next) => setStatus(next as ParkBookingStatus)}
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
            label="Visit date"
            name="date"
            errors={fieldErrors}
            helper="Re-runs seat-pool, open-on-date, uniqueness, and capacity checks."
          >
            <DatePicker value={date} onChange={setDate} />
          </FormField>

          <FormField
            label="Guests"
            name="guests"
            errors={fieldErrors}
            helper="Total price is recomputed when this changes."
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
