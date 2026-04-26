"use client";

import { useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reservation, RoomBooking } from "@/types/booking";

type Props = {
  open: boolean;
  matches: Reservation[];
  proposedCheckIn: string;
  proposedCheckOut: string;
  onAttach: (reservationId: number) => void;
  onStartFresh: () => void;
};

// Span across all confirmed room bookings on a reservation — the "trip"
// envelope the customer would mentally recognise. Falls back to "—" when
// the reservation has no confirmed rooms (shouldn't happen for matches).
function reservationDateRange(reservation: Reservation): string {
  const confirmed = (reservation.room_bookings ?? []).filter(
    (rb: RoomBooking) => rb.status === "confirmed",
  );
  if (confirmed.length === 0) return "—";
  const minIn = confirmed.reduce(
    (acc, rb) => (rb.check_in_date < acc ? rb.check_in_date : acc),
    confirmed[0].check_in_date,
  );
  const maxOut = confirmed.reduce(
    (acc, rb) => (rb.check_out_date > acc ? rb.check_out_date : acc),
    confirmed[0].check_out_date,
  );
  return `${minIn} → ${maxOut}`;
}

export function AttachReservationDialog({
  open,
  matches,
  proposedCheckIn,
  proposedCheckOut,
  onAttach,
  onStartFresh,
}: Props) {
  // Most-recent first — the customer is usually thinking about their newest
  // trip, and stale matches are noise.
  const sorted = useMemo(
    () =>
      [...matches].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
    [matches],
  );

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onStartFresh())}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add to an existing trip?</DialogTitle>
          <DialogDescription>
            Your dates ({proposedCheckIn} → {proposedCheckOut}) overlap with a
            trip you already have on file. Attach this room to the existing
            trip, or start a fresh one.
          </DialogDescription>
        </DialogHeader>

        <ul className="-mx-1 max-h-64 space-y-2 overflow-y-auto px-1">
          {sorted.map((reservation) => (
            <li key={reservation.id}>
              <button
                type="button"
                onClick={() => onAttach(reservation.id)}
                className="border-base hover:border-primary w-full rounded-lg border p-3 text-left transition-colors"
              >
                <p className="text-primary font-semibold">
                  Trip #{reservation.id}
                </p>
                <p className="text-muted text-xs">
                  {reservationDateRange(reservation)} ·{" "}
                  {(reservation.room_bookings ?? []).length} room booking
                  {(reservation.room_bookings ?? []).length === 1 ? "" : "s"}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <button
            type="button"
            className="text-sm font-semibold text-muted hover:text-base-color"
            onClick={onStartFresh}
          >
            Start a new trip instead
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
