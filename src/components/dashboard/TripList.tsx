import { TripCard } from "@/components/dashboard/TripCard";
import {
  deriveReservationStatus,
  reservationDateRange,
  type CustomerSnapshot,
} from "@/lib/customer-dashboard";
import type { Reservation } from "@/types/booking";

type Props = {
  snapshot: CustomerSnapshot;
};

// Lower bucket = surfaces first.
function sortBucket(reservation: Reservation): number {
  const status = deriveReservationStatus(reservation);
  const range = reservationDateRange(reservation);
  const today = new Date().toISOString().slice(0, 10);
  if (status === "active" && range && range.checkIn >= today) return 0;
  if (status === "active") return 1;
  if (status === "partial") return 2;
  return 3;
}

export function TripList({ snapshot }: Props) {
  if (snapshot.reservations.length === 0) {
    return (
      <section className="border-base bg-surface rounded-xl border p-6 text-center shadow-sm">
        <h3 className="text-base-color text-base font-semibold">Your trips</h3>
        <p className="text-muted mt-2 text-sm">
          You don&rsquo;t have any trips yet. Book a stay to get started.
        </p>
      </section>
    );
  }

  const sorted = [...snapshot.reservations].sort((a, b) => {
    const ba = sortBucket(a);
    const bb = sortBucket(b);
    if (ba !== bb) return ba - bb;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-base-color text-base font-semibold">Your trips</h3>
        <p className="text-muted text-xs">
          Each reservation groups your room, ferry, park, and beach bookings.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((reservation) => (
          <TripCard
            key={reservation.id}
            reservation={reservation}
            snapshot={snapshot}
          />
        ))}
      </div>
    </section>
  );
}
