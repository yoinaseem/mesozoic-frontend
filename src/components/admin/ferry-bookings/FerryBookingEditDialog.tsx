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
  updateFerryBooking,
  type FerryBookingUpdateInput,
} from "@/lib/api/ferry-bookings";
import type { FerryBooking, FerryBookingStatus } from "@/types/booking";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: FerryBooking | null;
  onSuccess: () => void;
};

export function FerryBookingEditDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<FerryBookingStatus>("confirmed");
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

  // Per §15: cancelled→confirmed is rejected with `422 errors.status`. The
  // Status select disables that transition client-side too so the operator
  // doesn't get a confusing 422 for a flow we can already prevent. The page
  // still surfaces a "Book again" affordance on cancelled rows.
  const reviving =
    booking?.status === "cancelled" && status === "confirmed";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking) return;
    reset();
    setSubmitting(true);

    // Diff-only payload — slot and travel_date swaps are NOT supported on
    // PATCH per §15 (cancel + rebook to change either), so we never send
    // those fields here. Capacity + seat-pool checks re-run server-side
    // inside the slot lock when guests changes.
    const diff: FerryBookingUpdateInput = {};
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
      await updateFerryBooking(booking.id, diff);
      toast.success(`Updated booking #${booking.id}.`);
      onSuccess();
    } catch (error) {
      // 422s flow through useFieldErrors so the cancelled→confirmed message
      // (and any other server validation) renders inline next to its field.
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !booking || reviving;

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
              onValueChange={(next) => setStatus(next as FerryBookingStatus)}
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

          {reviving ? (
            <p className="text-sm text-destructive">
              Cancelled bookings can&apos;t be re-confirmed (server rule). Use
              &ldquo;Book again&rdquo; to create a fresh booking instead.
            </p>
          ) : null}

          <FormField
            label="Guests"
            name="guests"
            errors={fieldErrors}
            helper="Re-runs seat-pool and ferry-capacity checks for the booking's travel date."
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
