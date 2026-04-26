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
  updateBeachBooking,
  type BeachBookingUpdateInput,
} from "@/lib/api/beach-bookings";
import type { BeachBooking, BeachBookingStatus } from "@/types/booking";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BeachBooking | null;
  onSuccess: () => void;
};

export function BeachBookingEditDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<BeachBookingStatus>("confirmed");
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

    // Diff-only payload — keeps the server's reconfirm + capacity guards
    // tight (DESD-97 hotfix re-runs duplicate + capacity checks inside the
    // schedule lock when status flips to confirmed) and avoids no-op writes.
    const diff: BeachBookingUpdateInput = {};
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
      await updateBeachBooking(booking.id, diff);
      toast.success(`Updated booking #${booking.id}.`);
      onSuccess();
    } catch (error) {
      // The reconfirm conflict comes back as 422 errors.status — useFieldErrors
      // surfaces it inline next to the Status select so the operator sees
      // exactly which rebook is blocking the reconfirm.
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
              onValueChange={(next) => setStatus(next as BeachBookingStatus)}
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
            helper="Re-runs seat-pool and activity-capacity checks if changed."
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
