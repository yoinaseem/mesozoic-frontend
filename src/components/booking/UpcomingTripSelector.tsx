"use client";

import type { Reservation, RoomBooking } from "@/types/booking";

type Props = {
  reservations: Reservation[];
  onSelect: (reservation: Reservation, anchorRoomBooking: RoomBooking) => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// The "anchor" is the confirmed room booking we hand to the cart context.
// Pick the one with the latest check_out_date — gives the broadest window
// for tickets and matches what the customer most likely thinks of as their
// "current" stay if they have multiple rooms on one reservation.
function pickAnchor(reservation: Reservation): RoomBooking | null {
  const today = todayIso();
  const candidates = (reservation.room_bookings ?? []).filter(
    (rb) => rb.status === "confirmed" && rb.check_out_date >= today,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, rb) =>
    rb.check_out_date > best.check_out_date ? rb : best,
  );
}

function dateRangeLabel(reservation: Reservation): string {
  const confirmed = (reservation.room_bookings ?? []).filter(
    (rb) => rb.status === "confirmed",
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

export function UpcomingTripSelector({ reservations, onSelect }: Props) {
  if (reservations.length === 0) return null;

  return (
    <section className="border-base bg-surface mb-6 rounded-xl border p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="text-primary text-lg font-semibold">
          Continue an upcoming trip
        </h2>
        <p className="text-muted text-sm">
          Add ferries, theme parks, and beach activities to a stay you&rsquo;ve
          already booked — no need to book another room.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {reservations.map((reservation) => {
          const anchor = pickAnchor(reservation);
          if (!anchor) return null;
          const hotelName = anchor.hotel?.name ?? "Your stay";
          const roomTypeName = anchor.room_type?.name ?? "";
          return (
            <li key={reservation.id}>
              <button
                type="button"
                onClick={() => onSelect(reservation, anchor)}
                className="border-base hover:border-primary w-full rounded-lg border p-4 text-left transition-colors"
              >
                <p className="text-primary font-semibold">{hotelName}</p>
                <p className="text-muted mt-1 text-sm">
                  {roomTypeName ? `${roomTypeName} · ` : ""}
                  {dateRangeLabel(reservation)} · {anchor.guests} guest
                  {anchor.guests === 1 ? "" : "s"}
                </p>
                <p className="text-primary mt-2 text-xs font-semibold">
                  Add activities &rarr;
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
